import jwt from '@hapi/jwt'
import boom from '@hapi/boom'
import { getOpenIdConfig } from './open-id-client.js'
import { checkOrganisation } from './check-organisation.js'

export const openIdProvider = async (name, authConfig) => {
  const oidcConf = await getOpenIdConfig(authConfig.oidcConfigurationUrl)

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

      const payload = jwt.token.decode(credentials.token).decoded.payload

      const { currentRelationshipId, relationships } = payload
      const orgIsAllowed = checkOrganisation(currentRelationshipId, relationships)

      if (orgIsAllowed === false) {
        throw boom.forbidden('organisation not allowed')
      }

      const displayName = [payload.firstName, payload.lastName]
        .filter((part) => part)
        .join(' ')

      credentials.profile = {
        id: payload.sub,
        correlationId: payload.correlationId,
        sessionId: payload.sessionId,
        contactId: payload.contactId,
        serviceId: payload.serviceId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName,
        email: payload.email,
        uniqueReference: payload.uniqueReference,
        loa: payload.loa,
        aal: payload.aal,
        enrolmentCount: payload.enrolmentCount,
        enrolmentRequestCount: payload.enrolmentRequestCount,
        currentRelationshipId: payload.currentRelationshipId,
        relationships: payload.relationships,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint
      }
    }
  }
}
