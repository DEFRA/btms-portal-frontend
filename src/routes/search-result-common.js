import joi from 'joi'
import { CACHE_CONTROL_NO_STORE, paths, queryStringParams } from './route-constants.js'
import { searchPatterns } from '../services/search-patterns.js'
import { getMetricNameBySearchType, metricsCounter } from '../utils/metrics.js'

export const createRouteConfig = (searchTermValidator, requestPath, requestHandler) => {
  return {
    method: 'get',
    path: requestPath,
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
            const value = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()
            const match = searchPatterns.find(({ key, pattern }) => searchTermValidator(key, pattern, value))

            if (!match) {
              request.yar.flash('searchError', {
                searchTerm: request.orig.query.searchTerm,
                isValid: false,
                errorCode: 'SEARCH_TERM_INVALID'
              })

              return h.redirect(paths.SEARCH).takeover()
            }

            const metricName = getMetricNameBySearchType(match.key)
            if (metricName) {
              metricsCounter(metricName)
            }

            return { [match.key]: value }
          },
          assign: 'searchQuery'
        }
      ],
      handler: requestHandler
    }
  }
}
