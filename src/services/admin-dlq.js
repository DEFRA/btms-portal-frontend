import { getDlqCount as getBtmsGatewayDlqCount, postBtmsGatewayRedrive } from './btms-gateway-client.js'
import { getDlqCount as getProcessorDlqCount, postProcessorRedrive } from './imports-processor-client.js'
import { getDlqCount as getReportingDlqCount, postReportingRedrive } from './reporting.js'
import { getDlqCount as getDecisionDeriverDlqCount, postDecisionDeriverRedrive } from './decision-deriver-client.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const getQueueCount = async (groupName, countEndpoint) => {
  switch (groupName) {
    case 'BTMS Gateway':
      return getBtmsGatewayDlqCount(countEndpoint)
    case 'Processor':
      return getProcessorDlqCount(countEndpoint)
    case 'Reporting':
      return getReportingDlqCount(countEndpoint)
    case 'Decision Deriver':
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
    case 'BTMS Gateway':
      return postBtmsGatewayRedrive(redriveEndpoint)
    case 'Processor':
      return postProcessorRedrive(redriveEndpoint)
    case 'Reporting':
      return postReportingRedrive(redriveEndpoint)
    case 'Decision Deriver':
      return postDecisionDeriverRedrive(redriveEndpoint)
    default:
      logger.warn(
        `Unknown DLQ Group ${groupName}. Redrive not requested.`)
      return undefined
  }
}

export {
  getQueueCount,
  getDlqCounts,
  postRedriveRequest
}
