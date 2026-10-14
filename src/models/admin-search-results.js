import { ADMIN_SEARCH_TYPES } from '../services/admin-messages.js'
import { prettyPrint } from './format.js'

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
