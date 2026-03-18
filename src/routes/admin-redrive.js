import { paths, queryStringParams, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getQueueCount, postRedriveRequest } from '../services/admin-dlq.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const ADMIN_REDRIVE_TEMPLATE = 'admin-redrive'
const dlqConfigs = config.get('dlq')

const getConfig = (redriveQueueRequested) => {
  const configGroup = dlqConfigs.groups.find(configuredGroup => configuredGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested))
  const queueConfig = configGroup.queues.find(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested)

  return { configGroup, queueConfig }
}

const createRedriveModel = async (configGroup, queueConfig) => {
  const currentQueueCount = await getQueueCount(configGroup.groupName, queueConfig.countEndpoint)

  return {
    redriveGroup: configGroup?.groupName,
    redriveQueue: queueConfig.sqsQueueName,
    redriveQueueCount: currentQueueCount?.deadLetterQueueCount,
  }
}

const isValidDlq = (redriveQueueRequested) => {
  return redriveQueueRequested && dlqConfigs.groups.some(configGroup =>
    configGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested))
}

export const adminRedriveGet = {
  method: 'get',
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
        const { configGroup, queueConfig } = getConfig(redriveQueueRequested)
        const redrive = await createRedriveModel(configGroup, queueConfig)

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

export const adminRedrivePost = {
  method: 'post',
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
      const { confirmRedriveQueue } = request.payload

      if (isValidDlq(confirmRedriveQueue)) {
        const { configGroup, queueConfig } = getConfig(confirmRedriveQueue)

        await postRedriveRequest(configGroup.groupName, queueConfig.redriveEndpoint)

        logger.info(`A redrive activity took place at ${new Date()}, to redrive all messages in the ${confirmRedriveQueue} queue`)

        return h.redirect(`${paths.ADMIN_REDRIVE_COMPLETE}?queue=${confirmRedriveQueue}`).takeover()
      }

      return h.redirect(paths.ADMIN_DLQ).takeover()
    } catch (error) {
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
