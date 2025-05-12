import joi from 'joi'
import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'
import { searchPatterns } from '../services/search-patterns.js'
import { getRelatedImportDeclarations } from '../services/related-import-declarations.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'

export const searchResult = {
  method: 'get',
  path: paths.SEARCH_RESULT,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      query: joi.object({
        searchTerm: joi.string().custom((origValue, h) => {
          const value = origValue.trim().toUpperCase()
          const match = searchPatterns.find(({ pattern }) => pattern.test(value))

          return match ? { [match.key]: value } : h.error('any.invalid')
        })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        request.yar.flash(
          'searchError',
          {
            searchTerm: request.orig.query.searchTerm,
            isValid: false,
            errorCode: 'INVALID_SEARCH_TERM'
          }
        )

        return h.redirect(paths.SEARCH).takeover()
      }
    },
    handler: async (request, h) => {
      const searchTerm = request.orig.query.searchTerm.trim()
      const data = await getRelatedImportDeclarations(request)

      if (
        data.customsDeclarations.length === 0 &&
        data.importPreNotifications.length === 0
      ) {
        request.yar.flash(
          'searchError',
          {
            searchTerm,
            isValid: false,
            errorCode: 'SEARCH_TERM_NOT_FOUND'
          }
        )

        return h.redirect(paths.SEARCH).takeover()
      }

      const customsDeclarations = mapCustomsDeclarations(data)
      const preNotifications = mapPreNotifications(data)

      const viewModel = {
        searchTerm,
        customsDeclarations,
        preNotifications,
        breadcrumbs: [
          { text: 'Search', href: '/search' },
          { text: searchTerm }
        ]
      }

      return h.view('search-result', viewModel)
    }
  }
}
