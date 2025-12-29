import { ADMIN_SEARCH_TYPES } from '../services/admin.js'
const searchTypesNeedingMsgSerialisation = new Set([
  ADMIN_SEARCH_TYPES.ALL_MESSAGES,
  ADMIN_SEARCH_TYPES.ALL_EVENTS
])

const prettyPrint = (obj, adminSearchType) => {
  const serialisedObj = JSON.stringify(
    obj,
    (key, value) => {
      if (adminSearchType === ADMIN_SEARCH_TYPES.ALL_EVENTS
        && key === 'changeSet') {
        // exclude the changeSet field
        return undefined
      }
      if (searchTypesNeedingMsgSerialisation.has(adminSearchType)
        && key === 'message') {
        // deserialise the message field
        return JSON.parse(value)
      }
      return value
    },
    2)
  return serialisedObj
}

export const mapAdminSearchResults = (rawSearchResults, searchType) => {
  switch (searchType) {
    case ADMIN_SEARCH_TYPES.ALL_MESSAGES:
    case ADMIN_SEARCH_TYPES.ALL_EVENTS:
      return rawSearchResults.map(r => prettyPrint(r, searchType))
    case ADMIN_SEARCH_TYPES.INFORMATION: {
      return prettyPrint(rawSearchResults, searchType)
    }
    default:
      throw new Error(`Unsupported admin search type: ${searchType}`)
  }
}
