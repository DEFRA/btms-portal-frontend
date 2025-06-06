import { paths } from './route-constants.js'

export const signedOut = {
  method: 'get',
  path: paths.SIGNED_OUT,
  handler: async (_request, h) => {
    return h.view('signed-out', { signInUrl: paths.SIGN_IN })
  }
}
