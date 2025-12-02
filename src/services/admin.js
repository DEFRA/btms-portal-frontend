import { getCustomsDeclaration, getImportPreNotification, getResourceEvents } from './imports-data-api-client.js'
import { getRawMessages } from './imports-processor-client.js'

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

export {
  ADMIN_SEARCH_TYPES,
  isValidAdminSearchType,
  search
}
