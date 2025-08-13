import { paths } from './route-constants.js'

export const home = {
  method: 'GET',
  path: paths.LANDING,
  handler: (request, h) => {
    if (request.auth.isAuthenticated) {
      return h.redirect('/search')
    }
    return h.view('home', {
      signInUrl: paths.SIGN_IN_CHOOSE,
      landingPage: true
    })
  }
}
