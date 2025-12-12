import { paths, queryStringParams } from './route-constants.js'
import { getRelatedImportDeclarations } from '../services/imports-data-api-client.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'
import { createRouteConfig } from './search-result-common.js'
import { searchKeys } from '../services/search-patterns.js'

const searchTermValidator = (key, pattern, value) => {
  return key !== searchKeys.GMR_ID && pattern.test(value)
}

export const searchResult = createRouteConfig(searchTermValidator, paths.SEARCH_RESULT, async (request, h) => {
  const searchTerm = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()
  const searchResults = await getRelatedImportDeclarations(request.pre.searchQuery)

  if (
    searchResults.customsDeclarations.length === 0 &&
    searchResults.importPreNotifications.length === 0
  ) {
    request.yar.flash('searchError', {
      searchTerm,
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
    })

    return h.redirect(paths.SEARCH).takeover()
  }

  const customsDeclarations = mapCustomsDeclarations(searchResults, searchTerm)
  const preNotifications = mapPreNotifications(searchResults, searchTerm)

  const viewModel = {
    resultsPage: true,
    searchTerm,
    customsDeclarations,
    preNotifications
  }

  return h.view('search-result', viewModel)
})
