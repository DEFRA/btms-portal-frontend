import jwt from '@hapi/jwt'
import { getOpenIdConfig } from './open-id-client.js'
import { checkOrganisation } from './check-organisation.js'
import { checkGroups } from './check-groups.js'
import { config } from '../config/config.js'
import { APP_SCOPES, AUTH_PROVIDERS, KEY_TYPES } from './auth-constants.js'

const entraAdminSecurityGroupId = config.get('auth.entraId.adminGroupId')

const setOrigins = (providerEndpoints) => {
  const { origins } = config.get('auth')

  const newOrigins = providerEndpoints.filter(Boolean).map((endpoint) => {
    const { origin } = new URL(endpoint)
    return origin
  })

  const updatedOrigins = [...new Set([...origins, ...newOrigins])]

  config.set('auth.origins', updatedOrigins)
}

const getPublicKey = async (kid, oidcConf, authConfig, provider) => {
  const oidcJwksKeys = await getOpenIdConfig(oidcConf.jwks_uri, authConfig.jwksClientTimeout)
  const signingKey = oidcJwksKeys?.keys?.find(key => key.kid === kid)

  if (signingKey) {
    if (signingKey.kty === KEY_TYPES.RSA) {
      return jwt.crypto.rsaPublicKeyToPEM(signingKey.n, signingKey.e)
    } else {
      throw new Error(
        `Unexpected algorithm used for token signing: ${signingKey.kty}`
      )
    }
  }

  throw new Error(`Unable to find ${provider} JWKS key matching kid: ${kid}`)
}

const getVerifiedPayload = async (provider, token, oidcConf, authConfig) => {
  const decodedToken = jwt.token.decode(token)
  const publicKey = await getPublicKey(decodedToken.decoded.header.kid, oidcConf, authConfig, provider)

  try {
    jwt.token.verify(decodedToken, publicKey, {
      iss: oidcConf.issuer,
      aud: authConfig.clientId
    })
  } catch (error) {
    throw new Error(`${provider} Token failed verification: ${error.message}`)
  }

  return decodedToken.decoded.payload
}

export const openIdProvider = async (name, authConfig) => {
  const oidcConf = await getOpenIdConfig(authConfig.oidcConfigurationUrl)

  const providerEndpoints = [
    authConfig.oidcConfigurationUrl,
    oidcConf.authorization_endpoint,
    oidcConf.token_endpoint,
    oidcConf.end_session_endpoint
  ]
  setOrigins(providerEndpoints)

  return {
    name,
    protocol: 'oauth2',
    useParamsAuth: true,
    auth: oidcConf.authorization_endpoint,
    token: oidcConf.token_endpoint,
    pkce: 'S256',
    scope: authConfig.scopes,
    profile: async function (credentials, params, _get) {
      if (!credentials?.token) {
        throw new Error(
          `${name} Auth Access Token not present. Unable to retrieve profile.`
        )
      }

      credentials.logoutUrl = oidcConf.end_session_endpoint
      credentials.tokenUrl = oidcConf.token_endpoint

      if (credentials.provider === AUTH_PROVIDERS.DEFRA_ID) {
        const payload = await getVerifiedPayload(credentials.provider, credentials.token, oidcConf, authConfig)

        checkOrganisation(payload.currentRelationshipId, payload.relationships)

        const displayName = [payload.firstName, payload.lastName]
          .filter((part) => part)
          .join(' ')
        credentials.externalSessionId = payload.sessionId
        credentials.profile = {
          id: payload.sub,
          correlationId: payload.correlationId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          displayName,
          email: payload.email,
          uniqueReference: payload.uniqueReference,
          currentRelationshipId: payload.currentRelationshipId,
          relationships: payload.relationships,
          roles: payload.roles
        }
      } else if (credentials.provider === AUTH_PROVIDERS.ENTRA_ID) {
        const payload = await getVerifiedPayload(credentials.provider, params.id_token, oidcConf, authConfig)
        const { groups = [] } = payload
        checkGroups(groups)

        credentials.externalSessionId = payload.sid
        credentials.idToken = params.id_token
        credentials.profile = {
          displayName: payload.name,
          email: payload.email,
          id: payload.sub
        }
        if (groups.includes(entraAdminSecurityGroupId)) {
          credentials.scope = [APP_SCOPES.ADMIN]
        }
      } else {
        throw new Error(`Unexpected auth provider encountered: ${credentials.provider}`)
      }
    }
  }
}
