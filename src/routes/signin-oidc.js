import { paths } from './route-constants.js'
import { setUserSession } from '../auth/user-session.js'

export const signinOidc = {
  method: ['GET', 'POST'],
  path: paths.AUTH_DEFRA_ID_CALLBACK,
  options: {
    auth: 'defraId'
  },
  handler: async (request, h) => {
    if (request.auth?.isAuthenticated) {
      const sessionId = crypto.randomUUID()

      await setUserSession(request, sessionId)

      request.cookieAuth.set({ sessionId })
    }

    const redirect = request.yar.flash('referrer')?.at(0) ?? paths.SEARCH

    return h.redirect(redirect)
  }
}
