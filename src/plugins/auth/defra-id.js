import Wreck from '@hapi/wreck'
import jwt from '@hapi/jwt'
import bell from '@hapi/bell'
import { deserialise } from 'kitsu-core'

import { config } from '../../config/config.js'

const authConfig = config.get('auth')
const sessionConfig = config.get('session')

const getDefraIdAuthConfig = async (oidcConfigurationUrl) => {
  const { payload } = await Wreck.get(oidcConfigurationUrl, {
    json: 'strict'
  })

  return deserialise(payload)
}

const defraId = {
  plugin: {
    name: 'defra-id',
    register: async (server) => {
      const oidcConfigurationUrl = authConfig.defraId.oidcConfigurationUrl
      const serviceId = authConfig.defraId.serviceId
      const clientId = authConfig.defraId.clientId
      const clientSecret = authConfig.defraId.clientSecret
      const authCallbackUrl = config.get('appBaseUrl') + '/signin-oidc'

      await server.register(bell)

      const oidcConf = await getDefraIdAuthConfig(oidcConfigurationUrl)

      server.auth.strategy('defra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', '/search')

          return authCallbackUrl
        },
        provider: {
          name: 'defra-id',
          protocol: 'oauth2',
          useParamsAuth: true,
          auth: oidcConf.authorization_endpoint,
          token: oidcConf.token_endpoint,
          scope: ['openid', 'offline_access'],
          profile: async function (credentials, params, _get) {
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
        },
        password: sessionConfig.cookie.password,
        clientId,
        clientSecret,
        cookie: 'bell-defra-id',
        isSecure: sessionConfig.cookie.secure,
        providerParams: {
          serviceId
        }
      })
    }
  }
}

export { defraId }
