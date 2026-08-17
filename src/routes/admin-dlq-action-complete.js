import {
  CACHE_CONTROL_NO_STORE,
  paths,
  queryStringParams
} from './route-constants.js'
import { APP_SCOPES } from '../auth/auth-constants.js'

const ADMIN_DLQ_ACTION_COMPLETE_TEMPLATE = 'admin-dlq-action-complete'

export const adminDlqActionComplete = {
  method: ['get'],
  path: paths.ADMIN_DLQ_ACTION_COMPLETE,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    const actionQueue = request.query[queryStringParams.QUEUE]
    const adminDlqPath = paths.ADMIN_DLQ
    const action = request.query[queryStringParams.ACTION]

    return h.view(ADMIN_DLQ_ACTION_COMPLETE_TEMPLATE, { actionQueue, adminDlqPath, action })
  }
}
