import { paths } from './route-constants.js'

export const login = {
  method: 'GET',
  path: paths.LOGIN,
  options: {
    auth: 'defra-id'
  },
  handler: async (_request, h) => {
    return h.redirect('/search')
  }
}
