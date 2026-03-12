import { getCustomsDeclaration, getImportPreNotification, getResourceEvents } from './imports-data-api-client.js'
import { getRawMessages, getDlqCount as getProcessorDlqCount  } from './imports-processor-client.js'
import { createLogger } from '../utils/logger.js'
import { getDlqCount as getBtmsGatewayDlqCount } from './btms-gateway-client.js'
import { getDlqCount as getReportingDlqCount } from './reporting.js'
import { getDlqCount as getDecisionDeriverDlqCount } from './decision-deriver-client.js'

const logger = createLogger()

const ADMIN_SEARCH_TYPES = {
  ALL_EVENTS: 'all-events',
  ALL_MESSAGES: 'all-messages',
  INFORMATION: 'information'
}

const NON_INFO_SEARCH_FUNCTIONS = {
  [ADMIN_SEARCH_TYPES.ALL_EVENTS] : getResourceEvents,
  [ADMIN_SEARCH_TYPES.ALL_MESSAGES]: getRawMessages
}

const INFO_SEARCH_FUNCTIONS = {
  "mrn": getCustomsDeclaration,
  "chedId": getImportPreNotification
}

const isValidAdminSearchType = (adminSearchType) => {
  return Object.keys(ADMIN_SEARCH_TYPES)
    .some(key => ADMIN_SEARCH_TYPES[key] === adminSearchType)
}

const search = async (resourceType, searchTerm, adminSearchType) => {
  const searchHandler =
    adminSearchType === ADMIN_SEARCH_TYPES.INFORMATION
      ? INFO_SEARCH_FUNCTIONS[resourceType]
      : NON_INFO_SEARCH_FUNCTIONS[adminSearchType]

  if (searchHandler) {
    return searchHandler(searchTerm)
  }

  throw new Error(`Unsupported admin search request, resourceType: ${resourceType}, type: ${adminSearchType}, searchTerm: ${searchTerm}`)
}

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
  ADMIN_SEARCH_TYPES,
  isValidAdminSearchType,
  search,
  getDlqCounts
}
