import { paths } from './route-constants.js'
import { setUserSession } from '../auth/user-session.js'
import { METRIC_NAMES, metricsCounter } from '../utils/metrics.js'
import { AUTH_PROVIDERS } from '../auth/auth-constants.js'

export const signinOidcEntra = {
  method: ['get', 'post'],
  path: paths.SIGNIN_ENTRA_ID_CALLBACK,
  options: {
    auth: AUTH_PROVIDERS.ENTRA_ID
  },
  handler: async (request, h) => {
    const sessionId = crypto.randomUUID()
    await setUserSession(request, sessionId)
    request.cookieAuth.set({ sessionId })

    await metricsCounter(METRIC_NAMES.SIGNIN_ENTRA_ID)
    return h.redirect(paths.SEARCH)
  }
}
