import Joi from 'joi'
import { paths, queryStringParams } from './route-constants.js'
import { isValidSearchTerm, hasSearchResult } from '../services/search-service.js'
import { noCache } from './cache-constants.js'

const viewTemplate = 'search'
const INVALID_SEARCH_TERM = 'INVALID_SEARCH_TERM'
const SEARCH_TERM_NOT_FOUND = 'SEARCH_TERM_NOT_FOUND'

const validSearchTermSchema = Joi.object({
  searchTerm: Joi.string().required().custom((value, helpers) => {
    if (!isValidSearchTerm(value)) {
      return helpers.error('any.invalid')
    }
    return value
  })
})

export const search = [{
  method: 'GET',
  path: paths.SEARCH,
  options: {
    auth: 'session',
    cache: noCache
  },
  handler: (_request, h) => {
    const searchError = _request.yar.flash('searchError')?.at(0) ?? {}
    return h.view(viewTemplate, searchError)
  }
},
{
  method: 'POST',
  path: paths.SEARCH,
  options: {
    auth: 'session',
    cache: noCache,
    validate: {
      payload: validSearchTermSchema,
      failAction: async (_request, h, _err) => {
        _request.yar.flash(
          'searchError',
          { searchTerm: _request.payload.searchTerm, isValid: false, errorCode: INVALID_SEARCH_TERM })

        return h.redirect(paths.SEARCH).takeover()
      }
    }
  },
  handler: async (_request, h) => {
    const searchTerm = _request.payload.searchTerm
    const searchTermHasResults = await hasSearchResult(searchTerm)

    if (!searchTermHasResults) {
      _request.yar.flash(
        'searchError',
        { searchTerm: _request.payload.searchTerm, isValid: false, errorCode: SEARCH_TERM_NOT_FOUND })

      return h.redirect(paths.SEARCH)
    }
    return h.redirect(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm}`)
  }
}
]
