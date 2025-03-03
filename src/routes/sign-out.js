import { paths } from './route-constants.js'
import { config, configKeys } from '../config/config.js'
import { dropUserSession, getUserSession } from '../auth/user-session.js'

export const signOut = {
  method: 'GET',
  path: paths.SIGN_OUT,
  handler: async (_request, h) => {
    const authedUser = await getUserSession(_request)

    if (!authedUser) {
      return h.redirect(paths.LANDING)
    }

    const referrer = config.get(configKeys.APP_BASE_URL)
    const idTokenHint = authedUser.idToken

    const logoutUrl = encodeURI(
      `${authedUser.logoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${referrer}`
    )

    dropUserSession(_request)
    _request.cookieAuth.clear()

    return h.redirect(logoutUrl)
  }
}
