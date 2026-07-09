import { paths, queryStringParams, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getQueueCount, postRedriveRequest, postDrainRequest } from '../services/admin-dlq.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'
import { DLQ_ACTION } from '../models/model-constants.js'

const logger = createLogger()

const ADMIN_DLQ_ACTION_TEMPLATE = 'admin-dlq-action'
const dlqConfigs = config.get('dlq')

const getConfig = (queueActionRequested) => {
  const configGroup = dlqConfigs.groups.find(configuredGroup => configuredGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === queueActionRequested))
  const queueConfig = configGroup.queues.find(configuredQueue => configuredQueue.sqsQueueName === queueActionRequested)

  return { configGroup, queueConfig }
}

const createActionModel = async (configGroup, queueConfig) => {
  const currentQueueCount = await getQueueCount(configGroup.groupName, queueConfig.countEndpoint)

  return {
    queueGroup: configGroup?.groupName,
    actionQueue: queueConfig.sqsQueueName,
    queueCount: currentQueueCount?.deadLetterQueueCount,
  }
}

const isValidDlq = (queueActionRequested) => {
  return queueActionRequested && dlqConfigs.groups.some(configGroup =>
    configGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === queueActionRequested))
}

export const adminDlqActionGet = {
  method: 'get',
  path: paths.ADMIN_DLQ_ACTION,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    try {
      const queueActionRequested = request.query[queryStringParams.QUEUE]

      if (isValidDlq(queueActionRequested)) {
        const { configGroup, queueConfig } = getConfig(queueActionRequested)
        const action = await createActionModel(configGroup, queueConfig)

        const actionModel = {
          action
        }

        return h.view(ADMIN_DLQ_ACTION_TEMPLATE, actionModel)
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

export const adminDlqActionPost = {
  method: 'post',
  path: paths.ADMIN_DLQ_ACTION,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    try {
      const { confirmActionQueue, confirmAction } = request.payload

      if (isValidDlq(confirmActionQueue)) {
        const { configGroup, queueConfig } = getConfig(confirmActionQueue)

        if (confirmAction === DLQ_ACTION.REDRIVE) {
          await postRedriveRequest(configGroup.groupName, queueConfig.redriveEndpoint)

          logger.info(
            `A redrive activity took place at ${new Date()}, to redrive all messages in the ${confirmActionQueue} queue`)
        }

        if (confirmAction === DLQ_ACTION.DRAIN) {
          await postDrainRequest(configGroup.groupName, queueConfig.drainEndpoint)

          logger.info(
            `A drain activity took place at ${new Date()}, to drain all messages in the ${confirmActionQueue} queue`)
        }

        return h.redirect(`${paths.ADMIN_DLQ_ACTION_COMPLETE}?queue=${confirmActionQueue}&action=${confirmAction}`).takeover()
      }

      return h.redirect(paths.ADMIN_DLQ).takeover()
    } catch (error) {
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
