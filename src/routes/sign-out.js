import { paths } from './route-constants.js'
import { config } from '../config/config.js'
import { dropUserSession, getUserSession } from '../auth/user-session.js'

export const signOut = {
  method: 'GET',
  path: paths.SIGN_OUT,
  handler: async (request, h) => {
    const authedUser = await getUserSession(request)

    if (!authedUser) {
      return h.redirect(paths.LANDING)
    }

    const referrer = `${config.get('appBaseUrl')}${paths.SIGNED_OUT}?provider=${
      authedUser.strategy
    }`
    const idTokenHint = authedUser.idToken

    const logoutUrl = encodeURI(
      `${authedUser.logoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${referrer}`
    )

    dropUserSession(request)
    request.cookieAuth.clear()

    return h.redirect(logoutUrl)
  }
}
