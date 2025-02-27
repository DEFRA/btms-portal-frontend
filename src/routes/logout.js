import _ from 'lodash'

import { paths } from './route-constants.js'
import { provideAuthedUser } from './prerequisites/provide-authed-user.js'
import { config } from '../config/config.js'

export const logout = {
  method: 'GET',
  path: paths.LOGOUT,
  options: {
    pre: [provideAuthedUser]
  },
  handler: async (_request, h) => {
    const authedUser = _request.pre.authedUser

    if (_.isEmpty(authedUser)) {
      return h.redirect('/')
    }

    const referrer = config.get('appBaseUrl')
    const idTokenHint = authedUser.idToken

    const logoutUrl = encodeURI(
      `${authedUser.logoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${referrer}`
    )

    _request.dropUserSession()
    _request.cookieAuth.clear()

    return h.redirect(logoutUrl)
  }
}
