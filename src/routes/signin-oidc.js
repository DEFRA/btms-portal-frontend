import { paths } from './route-constants.js'
import { setUserSession } from '../auth/user-session.js'

export const signinOidc = {
  method: ['GET', 'POST'],
  path: paths.AUTH_DEFRA_ID_CALLBACK,
  options: {
    auth: 'defra-id'
  },
  handler: async (_request, h) => {
    if (_request.auth?.isAuthenticated) {
      const sessionId = crypto.randomUUID()

      await setUserSession(_request, sessionId)

      _request.cookieAuth.set({ sessionId })

      _request.logger.info('User has been successfully authenticated')
    }

    const redirect = _request.yar.flash('referrer')?.at(0) ?? paths.SEARCH

    return h.redirect(redirect)
  }
}
