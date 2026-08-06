import { getDlqCount as getBtmsGatewayDlqCount, postBtmsGatewayRedrive, postBtmsGatewayDrain } from './btms-gateway-client.js'
import { getDlqCount as getProcessorDlqCount, postProcessorRedrive, postProcessorDrain } from './imports-processor-client.js'
import { getDlqCount as getReportingDlqCount, postReportingRedrive, postReportingDrain } from './reporting.js'
import { getDlqCount as getDecisionDeriverDlqCount, postDecisionDeriverRedrive, postDecisionDeriverDrain } from './decision-deriver-client.js'
import { createLogger } from '../utils/logger.js'
import { DLQ_GROUP } from '../models/model-constants.js'

const logger = createLogger()

const getQueueCount = async (groupName, countEndpoint) => {
  switch (groupName) {
    case DLQ_GROUP.BTMS_GATEWAY:
      return getBtmsGatewayDlqCount(countEndpoint)
    case DLQ_GROUP.PROCESSOR:
      return getProcessorDlqCount(countEndpoint)
    case DLQ_GROUP.REPORTING:
      return getReportingDlqCount(countEndpoint)
    case DLQ_GROUP.DECISION_DERIVER:
      return getDecisionDeriverDlqCount(countEndpoint)
    default:
      logger.warn(
        `Unknown DLQ Group ${groupName}. Count will not be displayed for these queue(s).`)
      return undefined
  }
}

const getDlqCounts = async (dlqConfigs) => {
  const queueCounts = []

  for (const dlqGroup of dlqConfigs.groups) {
    for (const queue of dlqGroup.queues) {
      try {
        const queueCount = await getQueueCount(dlqGroup.groupName, queue.countEndpoint)

        queueCounts.push({
          sqsQueueName: queue.sqsQueueName,
          count: queueCount ? queueCount?.deadLetterQueueCount : 'Retrieve count failed'
        })
      } catch (error) {
        logger.warn(
          `Error retrieving DLQ count for ${queue.sqsQueueName}: ${error.message}`)
        queueCounts.push({
          sqsQueueName: queue.sqsQueueName,
          count: 'Retrieve count failed'
        })
      }
    }
  }

  return queueCounts
}

const postRedriveRequest = async (groupName, redriveEndpoint) => {
  switch (groupName) {
    case DLQ_GROUP.BTMS_GATEWAY:
      return postBtmsGatewayRedrive(redriveEndpoint)
    case DLQ_GROUP.PROCESSOR:
      return postProcessorRedrive(redriveEndpoint)
    case DLQ_GROUP.REPORTING:
      return postReportingRedrive(redriveEndpoint)
    case DLQ_GROUP.DECISION_DERIVER:
      return postDecisionDeriverRedrive(redriveEndpoint)
    default:
      logger.warn(
        `Unknown DLQ Group ${groupName}. Redrive not requested.`)
      return undefined
  }
}

const postDrainRequest = async (groupName, drainEndpoint) => {
  switch (groupName) {
    case DLQ_GROUP.BTMS_GATEWAY:
      return postBtmsGatewayDrain(drainEndpoint)
    case DLQ_GROUP.PROCESSOR:
      return postProcessorDrain(drainEndpoint)
    case DLQ_GROUP.REPORTING:
      return postReportingDrain(drainEndpoint)
    case DLQ_GROUP.DECISION_DERIVER:
      return postDecisionDeriverDrain(drainEndpoint)
    default:
      logger.warn(
        `Unknown DLQ Group ${groupName}. Drain not requested.`)
      return undefined
  }
}

export {
  getQueueCount,
  getDlqCounts,
  postRedriveRequest,
  postDrainRequest
}
