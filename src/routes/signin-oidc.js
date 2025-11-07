import { paths } from './route-constants.js'
import { setUserSession } from '../auth/user-session.js'
import { metricsCounter } from '../utils/metrics.js'
import { metricName } from '../models/model-constants.js'

export const signinOidc = {
  method: ['get', 'post'],
  path: paths.SIGNIN_DEFRA_ID_CALLBACK,
  options: {
    auth: 'defraId'
  },
  handler: async (request, h) => {
    const sessionId = crypto.randomUUID()
    await setUserSession(request, sessionId)
    request.cookieAuth.set({ sessionId })

    metricsCounter(metricName.SIGNIN_DEFRA_ID)
    return h.redirect(paths.SEARCH)
  }
}
