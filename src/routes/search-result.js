import { performSearch } from '../services/search-service.js'
import { createSearchResultsModel } from '../models/index.js'

export const searchResult = {
  method: 'GET',
  path: '/search-result',
  handler: async (_request, h) => {
    const searchResult = await performSearch(_request.query.searchTerm)
    const model = createSearchResultsModel(searchResult)
    return h.view('search-results', {
      pageTitle: 'Search result - Border Trade Matching Service',
      ...model
    })
  }
}
