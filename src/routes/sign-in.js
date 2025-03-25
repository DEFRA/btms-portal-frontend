import { paths } from './route-constants.js'
import { noCache } from './cache-constants.js'

export const signIn = {
  method: 'GET',
  path: paths.SIGN_IN,
  options: {
    auth: 'defra-id',
    cache: noCache
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
