import bell from '@hapi/bell'
import { paths } from '../../routes/route-constants.js'
import { config, configKeys } from '../../config/config.js'
import { defraIdAuthProvider } from '../../auth/defra-id-auth-provider.js'

const authConfig = config.get('auth.defraId')
const sessionConfig = config.get('session')

const defraId = {
  plugin: {
    name: 'defra-id',
    register: async (server) => {
      const serviceId = authConfig.serviceId
      const clientId = authConfig.clientId
      const clientSecret = authConfig.clientSecret
      const authCallbackUrl = config.get(configKeys.APP_BASE_URL) + paths.AUTH_DEFRA_ID_CALLBACK
      const provider = await defraIdAuthProvider()

      await server.register(bell)

      server.auth.strategy('defra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', paths.SEARCH)

          return authCallbackUrl
        },
        provider,
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
