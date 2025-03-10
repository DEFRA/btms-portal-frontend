import { getDefraIdAuthConfig } from './defraId-client.js'
import { config } from '../config/config.js'
import jwt from '@hapi/jwt'

export const defraIdAuthProvider = async () => {
  const authConfig = config.get('auth.defraId')
  const oidcConfigurationUrl = authConfig.oidcConfigurationUrl
  const oidcConf = await getDefraIdAuthConfig(oidcConfigurationUrl)

  return {
    name: 'defra-id',
    protocol: 'oauth2',
    useParamsAuth: true,
    auth: oidcConf.authorization_endpoint,
    token: oidcConf.token_endpoint,
    pkce: 'S256',
    scope: authConfig.scopes,
    profile: async function (credentials, params, _get) {
      if (!credentials?.token) {
        throw new Error(
          'Defra ID Auth Access Token not present. Unable to retrieve profile.')
      }

      const payload = jwt.token.decode(credentials.token).decoded.payload
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
