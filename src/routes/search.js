import {
  CACHE_CONTROL_NO_STORE,
  paths,
  queryStringParams
} from './route-constants.js'
import { searchKeys, searchPatterns } from '../services/search-patterns.js'

export const search = {
  method: 'get',
  path: paths.SEARCH,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    pre: [
      {
        method: (request, h) => {
          const value = request?.query?.searchTerm?.trim().toUpperCase()
          if (value !== undefined) {
            const match = searchPatterns.find(({ pattern }) =>
              pattern.test(value)
            )

            if (!match) {
              request.yar.flash('searchError', {
                searchTerm: value,
                isValid: false,
                errorCode: value === '' ? 'SEARCH_TERM_REQUIRED' : 'SEARCH_TERM_INVALID'
              })

              return {}
            }

            if (match.key === searchKeys.GMR_ID) {
              return h.redirect(`${paths.GMR_RESULTS}?${queryStringParams.SEARCH_TERM}=${value}`).takeover()
            }

            return h.redirect(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${value}`).takeover()
          }

          return {}
        }
      }
    ]
  },
  handler: (request, h) => {
    const [searchError] = request.yar.flash('searchError')

    return h.view('search', searchError)
  }
}
