import { paths } from './route-constants.js'
import { setUserSession } from '../auth/user-session.js'

export const signinOidcEntra = {
  method: ['get', 'post'],
  path: paths.SIGNIN_ENTRA_ID_CALLBACK,
  options: {
    auth: 'entraId'
  },
  handler: async (request, h) => {
    const sessionId = crypto.randomUUID()
    await setUserSession(request, sessionId)
    request.cookieAuth.set({ sessionId })

    return h.redirect(paths.SEARCH)
  }
}
