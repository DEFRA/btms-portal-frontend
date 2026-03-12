import { paths, queryStringParams, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getQueueCount } from '../services/admin-dlq.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { config } from '../config/config.js'

const ADMIN_REDRIVE_TEMPLATE = 'admin-redrive'
const dlqConfigs = config.get('dlq')

const createRedriveModel = async (redriveQueueRequested) => {
  const configGroup = dlqConfigs.groups.find(configuredGroup => configuredGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested))
  const queueConfig = configGroup.queues.find(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested)
  const currentQueueCount = await getQueueCount(configGroup.groupName, queueConfig.countEndpoint)

  return {
    redriveGroup: configGroup?.groupName,
    redriveQueue: redriveQueueRequested,
    redriveQueueCount: currentQueueCount?.deadLetterQueueCount,
  }
}

const isValidDlq = (redriveQueueRequested) => {
  return redriveQueueRequested && dlqConfigs.groups.some(configGroup =>
    configGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested))
}

export const adminRedrive = {
  method: ['get', 'post'],
  path: paths.ADMIN_REDRIVE,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    try {
      const redriveQueueRequested = request.query[queryStringParams.QUEUE]

      if (isValidDlq(redriveQueueRequested)) {
        const redrive = await createRedriveModel(redriveQueueRequested)

        const redriveModel = {
          redrive
        }

        return h.view(ADMIN_REDRIVE_TEMPLATE, redriveModel)
      } else {
        return h.redirect(paths.ADMIN_DLQ).takeover()
      }
    } catch (error) {
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
