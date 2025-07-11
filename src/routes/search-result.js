import joi from 'joi'
import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'
import { searchPatterns } from '../services/search-patterns.js'
import { getRelatedImportDeclarations } from '../services/related-import-declarations.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'
import { metricsCounter } from '../utils/metrics.js'

export const searchResult = {
  method: 'get',
  path: paths.SEARCH_RESULT,
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
          const match = searchPatterns.find(({ pattern }) =>
            pattern.test(value)
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
    handler: async (request, h) => {
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
    }
  }
}
