import { paths } from './route-constants.js'
import { getRelatedImportDeclarations } from '../services/related-import-declarations.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'
import { results } from './results.js'

export const searchResult = results(false, paths.SEARCH_RESULT, async (request, h) => {
  const searchTerm = request.query.searchTerm.trim()
  const data = await getRelatedImportDeclarations(request)

  if (
    data.customsDeclarations.length === 0 &&
    data.importPreNotifications.length === 0
  ) {
    request.yar.flash('searchError', {
      searchTerm,
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
    })

    return h.redirect(paths.SEARCH).takeover()
  }

  const customsDeclarations = mapCustomsDeclarations(data)
  const preNotifications = mapPreNotifications(data)

  const viewModel = {
    resultsPage: true,
    searchTerm,
    customsDeclarations,
    preNotifications
  }

  return h.view('search-result', viewModel)
})
