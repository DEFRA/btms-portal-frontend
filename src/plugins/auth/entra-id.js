import { paths } from '../../routes/route-constants.js'
import { config, configKeys } from '../../config/config.js'
import { entraIdAuthProvider } from '../../auth/entra-id-auth-provider.js'

const authConfig = config.get('auth.entraId')
const sessionConfig = config.get('session')

const entraId = {
  plugin: {
    name: 'entra-id',
    register: async (server) => {
      const serviceId = authConfig.serviceId
      const clientId = authConfig.clientId
      const clientSecret = authConfig.clientSecret
      const authCallbackUrl = config.get(configKeys.APP_BASE_URL) + paths.AUTH_ENTRA_ID_CALLBACK
      const provider = await entraIdAuthProvider()

      // Already registered in Defra ID strategy. Would need to refactor plugin registration so this only happens once.
      // await server.register(bell)

      server.auth.strategy('entra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', paths.SEARCH)

          return authCallbackUrl
        },
        provider,
        password: sessionConfig.cookie.password,
        clientId,
        clientSecret,
        cookie: 'bell-entra-id',
        isSecure: sessionConfig.cookie.secure,
        providerParams: {
          serviceId
        }
      })
    }
  }
}

export { entraId }
