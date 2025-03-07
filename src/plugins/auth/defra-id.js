import bell from '@hapi/bell'
import { paths } from '../../routes/route-constants.js'
import { config, configKeys } from '../../config/config.js'
import { getDefraIdAuthConfig } from '../../auth/defraId-client.js'
import { supplyProfileFunc } from './utils/profile-provider.js'

const authConfig = config.get('auth.defraId')
const sessionConfig = config.get('session')

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
          pkce: 'S256',
          scope: authConfig.scopes,
          profile: await supplyProfileFunc(oidcConf)
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
