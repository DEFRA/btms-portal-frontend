import joi from 'joi'
import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'
import { searchKeys, searchPatterns } from '../services/search-patterns.js'
import { metricsCounter } from '../utils/metrics.js'

export const results = (isGmrResults, resultsPath, requestHandler) => {
  return {
    method: 'get',
    path: resultsPath,
    options: {
      auth: 'session',
      cache: CACHE_CONTROL_NO_STORE,
      validate: {
        query: joi
        .object({
          searchTerm: joi.string().required()
        })
        .unknown(),
        failAction: async (request, h, error) => {
          request.logger.setBindings({ error })
          request.yar.flash('searchError', {
            searchTerm: '',
            isValid: false,
            errorCode: 'SEARCH_TERM_REQUIRED'
          })
          return h.redirect(paths.SEARCH).takeover()
        }
      },
      pre: [
        {
          method: (request, h) => {
            const value = request.query.searchTerm.trim().toUpperCase()
            const match = searchPatterns.find(({ key, pattern }) =>
              (isGmrResults && key === searchKeys.GMR_ID && pattern.test(value))
              || (!isGmrResults && key !== searchKeys.GMR_ID && pattern.test(value))
            )

            if (!match) {
              request.yar.flash('searchError', {
                searchTerm: request.orig.query.searchTerm,
                isValid: false,
                errorCode: 'SEARCH_TERM_INVALID'
              })

              return h.redirect(paths.SEARCH).takeover()
            }

            metricsCounter(`search.${match.key}`)
            return { [match.key]: value }
          },
          assign: 'searchQuery'
        }
      ],
      handler: requestHandler
    }
  }
}
