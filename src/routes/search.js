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
          const value = request.query[queryStringParams.SEARCH_TERM]?.trim().toUpperCase()
          if (value !== undefined) {
            if (value === '') {
              request.yar.flash('searchError', {
                searchTerm: value,
                isValid: false,
                errorCode: 'SEARCH_TERM_REQUIRED'
              })

              return {}
            }

            const match = searchPatterns.find(({ pattern }) =>
              pattern.test(value)
            )

            if (!match) {
              return h.redirect(`${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${value}`).takeover()
            }

            if (match.key === searchKeys.GMR_ID) {
              return h.redirect(`${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${value}`).takeover()
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
