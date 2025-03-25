import { paths } from './route-constants.js'

export const signIn = {
  method: 'GET',
  path: paths.SIGN_IN,
  options: {
    auth: 'defra-id'
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
