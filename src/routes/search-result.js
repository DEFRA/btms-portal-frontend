import { performSearch } from '../services/index.js'
import { createSearchResultsModel } from '../models/index.js'
import { CACHE_CONTROL_NO_STORE, paths, queryStringParams } from './route-constants.js'

export const searchResult = {
  method: 'GET',
  path: paths.SEARCH_RESULT,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (_request, h) => {
    const searchResults = await performSearch(_request.query[queryStringParams.SEARCH_TERM])
    const model = createSearchResultsModel(searchResults)
    return h.view('search-results', { ...model })
  }
}
