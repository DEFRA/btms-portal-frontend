import { paths } from './route-constants.js'

export const signInInternal = {
  method: 'GET',
  path: paths.SIGN_IN_INTERNAL,
  options: {
    auth: 'entra-id'
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
