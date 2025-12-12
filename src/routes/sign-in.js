import { paths } from './route-constants.js'
import { AUTH_PROVIDERS } from '../auth/auth-constants.js'

export const signIn = {
  method: 'GET',
  path: paths.SIGN_IN,
  options: {
    auth: AUTH_PROVIDERS.DEFRA_ID
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
