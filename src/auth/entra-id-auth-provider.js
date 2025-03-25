import { getEntraIdAuthConfig } from './entra-id-client.js'
import { config } from '../config/config.js'
import jwt from '@hapi/jwt'

export const entraIdAuthProvider = async () => {
  const authConfig = config.get('auth.entraId')
  const oidcConfigurationUrl = authConfig.oidcConfigurationUrl
  const oidcConf = await getEntraIdAuthConfig(oidcConfigurationUrl)

  return {
    name: 'entra-id',
    protocol: 'oauth2',
    useParamsAuth: true,
    auth: oidcConf.authorization_endpoint,
    token: oidcConf.token_endpoint,
    pkce: 'S256',
    scope: authConfig.scopes,
    profile: async function (credentials, params, _get) {
      if (!credentials?.token) {
        throw new Error(
          'Entra ID Auth Access Token not present. Unable to retrieve profile.')
      }

      const payload = jwt.token.decode(credentials.token).decoded.payload
      const displayName = [payload.firstName, payload.lastName]
        .filter((part) => part)
        .join(' ')

      // What info do we get back from Entra? Need to refactor this and Defra ID provider, so we only use the claims properties that are relevant
      credentials.profile = {
        id: payload.sub,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName,
        email: payload.email,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint,
        internal: true // Need to store this somewhere in unauthenticated session storage?
      }
    }
  }
}
