import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getDlqCounts } from '../services/admin-dlq.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { config } from '../config/config.js'
import { mapDlqs } from '../models/admin-dlq.js'

const ADMIN_DLQ_TEMPLATE = 'admin-dlq'
const dlqConfigs = config.get('dlq')

export const adminDlq = {
  method: ['get'],
  path: paths.ADMIN_DLQ,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    try {
      const queueCounts = await getDlqCounts(dlqConfigs)
      const dlqs = mapDlqs(dlqConfigs, queueCounts)

      return h.view(ADMIN_DLQ_TEMPLATE, { dlqs })
    } catch (error) {
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
