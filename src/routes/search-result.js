import { performSearch } from '../services/index.js'
import { createSearchResultsModel } from '../models/index.js'
import { paths, queryStringParams } from './route-constants.js'
import { noCache } from './cache-constants.js'
export const searchResult = {
  method: 'GET',
  path: paths.SEARCH_RESULT,
  options: {
    auth: 'session',
    cache: noCache
  },
  handler: async (_request, h) => {
    const searchResults = await performSearch(_request.query[queryStringParams.SEARCH_TERM])
    const model = createSearchResultsModel(searchResults)
    return h.view('search-results', { ...model })
  }
}
