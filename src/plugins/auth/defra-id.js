import jwt from '@hapi/jwt'
import bell from '@hapi/bell'
import { paths } from '../../routes/route-constants.js'
import { config, configKeys } from '../../config/config.js'
import { getDefraIdAuthConfig } from '../../services/defraId-client.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import Wreck from '@hapi/wreck'
import { createLogger } from '../../utils/logger.js'

const authConfig = config.get('auth.defraId')
const sessionConfig = config.get('session')
const logger = createLogger()

const configureProxy = () => {
  const proxyUrl = config.get('httpsProxy') ?? config.get('httpProxy')

  if (proxyUrl) {
    const httpsAgent = new HttpsProxyAgent(proxyUrl)

    Wreck.agents.http = httpsAgent
    Wreck.agents.https = httpsAgent
    Wreck.agents.httpsAllowUnauthorized = httpsAgent
  }
}
const defraId = {
  plugin: {
    name: 'defra-id',
    register: async (server) => {
      const oidcConfigurationUrl = authConfig.oidcConfigurationUrl
      const serviceId = authConfig.serviceId
      const clientId = authConfig.clientId
      const clientSecret = authConfig.clientSecret
      const authCallbackUrl = config.get(configKeys.APP_BASE_URL) + paths.AUTH_DEFRA_ID_CALLBACK

      await server.register(bell)

      const oidcConf = await getDefraIdAuthConfig(oidcConfigurationUrl)

      configureProxy()

      server.auth.strategy('defra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', paths.SEARCH)

          return authCallbackUrl
        },
        provider: {
          name: 'defra-id',
          protocol: 'oauth2',
          useParamsAuth: true,
          auth: oidcConf.authorization_endpoint,
          token: oidcConf.token_endpoint,
          scope: authConfig.scopes,
          profile: async function (credentials, params, _get) {
            logger.info(`CREDENTIALS: ${credentials}`)
            logger.info(`PARAMS: ${params}`)

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
