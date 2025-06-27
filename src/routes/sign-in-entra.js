import { paths } from './route-constants.js'

export const signInEntra = {
  method: 'GET',
  path: paths.SIGN_IN_ENTRA,
  options: {
    auth: 'entraId'
  },
  handler: async (_request, h) => {
    return h.redirect(paths.SEARCH)
  }
}
