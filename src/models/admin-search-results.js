import Prism from 'prismjs'
import { ADMIN_SEARCH_TYPES } from '../services/admin.js'

const prettyPrintJson = (json) => JSON.stringify(json, null, 2)

const toHtml = (serialisedObj) => {
  return Prism.highlight(
    serialisedObj,
    Prism.languages.javascript,
    'javascript'
  ).split('\n')
}

export const mapAdminSearchResults = (rawSearchResults, searchType) => {
  switch (searchType) {
    case ADMIN_SEARCH_TYPES.ALL_MESSAGES:
      return rawSearchResults
        .map(r => {
          r.message = JSON.parse(r.message)
          return prettyPrintJson(r)
        })
        .map(json => toHtml(json))
    case ADMIN_SEARCH_TYPES.ALL_EVENTS:
      return rawSearchResults
        .map(r => {
          r.message = r.message.replace(/,\s*"changeSet":\[.*]/, '')
          r.message = JSON.parse(r.message)
          return prettyPrintJson(r)
        })
        .map(json => toHtml(json))
    case ADMIN_SEARCH_TYPES.INFORMATION:
      return toHtml(prettyPrintJson(rawSearchResults))
    default:
      throw new Error(`Unsupported admin search type: ${searchType}`)
  }
}
