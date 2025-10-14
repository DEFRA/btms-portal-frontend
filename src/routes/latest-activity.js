import { mapLatestActivity } from '../models/latest-activity.js'
import { getLastReceived, getLastSent } from '../services/reporting.js'
import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'

export const latestActivity = {
  method: 'get',
  path: paths.LATEST_ACTIVITY,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    const [lastSent, lastReceived] = await Promise.all([
      getLastSent(request),
      getLastReceived(request)
    ])

    try {
      return h.view('latest-activity', {
        latestActivity: mapLatestActivity(lastSent, lastReceived)
      })
    } catch (error) {
      request.logger.setBindings({ error })
      throw error
    }
  }
}
