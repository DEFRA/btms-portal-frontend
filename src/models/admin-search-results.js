import { ADMIN_SEARCH_TYPES } from '../services/admin.js'
const searchTypesNeedingMsgSerialisation = new Set([
  ADMIN_SEARCH_TYPES.ALL_MESSAGES,
  ADMIN_SEARCH_TYPES.ALL_EVENTS
])

const prettyPrint = (obj) => {
  // A 'replacer' function has intentionally not
  // been provided to JSON.stringify here
  // as it isn't straightforward to determine the context for
  // the "message" and "changeSet" fields in order to replace their values
  return JSON.stringify(obj, null, 2)
}

export const mapAdminSearchResults = (rawSearchResults, searchType) => {
  switch (searchType) {
    case ADMIN_SEARCH_TYPES.ALL_MESSAGES:
      return rawSearchResults
        .map(rawMsg => {
          rawMsg.message = JSON.parse(rawMsg.message)
          return prettyPrint(rawMsg)
        })
    case ADMIN_SEARCH_TYPES.ALL_EVENTS:
      return rawSearchResults
        .map(resourceEvent => {
          resourceEvent.message = resourceEvent.message.replace(/,\s*"changeSet":\[.*]/, '')
          resourceEvent.message = JSON.parse(resourceEvent.message)
          return prettyPrint(resourceEvent)
        })
    case ADMIN_SEARCH_TYPES.INFORMATION:
      return prettyPrint(rawSearchResults)
    default:
      throw new Error(`Unsupported admin search type: ${searchType}`)
  }
}
