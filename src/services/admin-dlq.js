import { getDlqCount as getBtmsGatewayDlqCount } from './btms-gateway-client.js'
import { getDlqCount as getProcessorDlqCount } from './imports-processor-client.js'
import { getDlqCount as getReportingDlqCount } from './reporting.js'
import { getDlqCount as getDecisionDeriverDlqCount } from './decision-deriver-client.js'
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

export {
  getQueueCount,
  getDlqCounts
}
