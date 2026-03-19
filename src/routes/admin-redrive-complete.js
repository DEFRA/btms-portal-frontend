import {
  CACHE_CONTROL_NO_STORE,
  paths,
  queryStringParams
} from './route-constants.js'
import { APP_SCOPES } from '../auth/auth-constants.js'

const ADMIN_REDRIVE_COMPLETE_TEMPLATE = 'admin-redrive-complete'

export const adminRedriveComplete = {
  method: ['get'],
  path: paths.ADMIN_REDRIVE_COMPLETE,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    const redrivenQueue = request.query[queryStringParams.QUEUE]

    return h.view(ADMIN_REDRIVE_COMPLETE_TEMPLATE, { redrivenQueue })
  }
}
