import { paths } from './route-constants.js'
import { config } from '../config/config.js'
import { getLogoutUrl } from '../auth/open-id-provider.js'
import { dropUserSession, getUserSession } from '../auth/user-session.js'

export const signOut = {
  method: 'GET',
  path: paths.SIGN_OUT,
  options: {
    auth: false
  },
  handler: async (request, h) => {
    const authedUser = await getUserSession(request)
    const postLogoutRedirect = `${config.get('appBaseUrl')}${paths.SIGNED_OUT}?provider=`

    if (!authedUser) {
      const { provider } = request.query
      const logoutUrl = getLogoutUrl(provider)

      if (!logoutUrl) {
        return h.redirect(paths.LANDING)
      }

      request.cookieAuth.clear()

      return h.redirect(
        encodeURI(
          `${logoutUrl}?post_logout_redirect_uri=${postLogoutRedirect}${provider}`
        )
      )
    }

    const referrer = `${postLogoutRedirect}${authedUser.provider}`
    const idTokenHint = authedUser.idToken

    const logoutUrlWithIdTokenHint = encodeURI(
      `${authedUser.logoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${referrer}`
    )

    dropUserSession(request)
    request.cookieAuth.clear()

    return h.redirect(logoutUrlWithIdTokenHint)
  }
}
