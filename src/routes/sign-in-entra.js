import { paths } from './route-constants.js'
import { AUTH_PROVIDERS } from '../auth/auth-constants.js'

export const signInEntra = {
  method: 'GET',
  path: paths.SIGN_IN_ENTRA,
  options: {
    auth: AUTH_PROVIDERS.ENTRA_ID
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
