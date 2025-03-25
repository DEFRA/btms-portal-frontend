import { paths } from './route-constants.js'

export const home = {
  method: 'GET',
  path: paths.LANDING,
  handler: (_request, h) => {
    return h.view('home', { signInUrl: paths.SIGN_IN, signOutUrl: paths.SIGN_OUT })
  }
}
