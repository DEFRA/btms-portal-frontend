import { paths } from '../../routes/route-constants.js'
import { config } from '../../config/config.js'
import { openIdProvider } from '../../auth/open-id-provider.js'

const { defraId, entraId } = config.get('auth')
const baseUrl = config.get('appBaseUrl')
const { cookie } = config.get('session')

const openId = {
  plugin: {
    name: 'open-id',
    register: async (server) => {
      const defra = await openIdProvider('defraId', defraId)
      server.auth.strategy('defraId', 'bell', {
        location: () => `${baseUrl}${paths.AUTH_DEFRA_ID_CALLBACK}`,
        provider: defra,
        password: cookie.password,
        clientId: defraId.clientId,
        clientSecret: defraId.clientSecret,
        isSecure: cookie.secure,
        providerParams: {
          serviceId: defraId.serviceId
        }
      })

      const entra = await openIdProvider('entraId', entraId)
      server.auth.strategy('entraId', 'bell', {
        location: () => `${baseUrl}${paths.SIGNIN_ENTRA_ID_CALLBACK}`,
        provider: entra,
        password: cookie.password,
        clientId: entraId.clientId,
        clientSecret: entraId.clientSecret,
        isSecure: cookie.secure
      })
    }
  }
}

export { openId }
