import Joi from 'joi'
import { paths, queryStringParams } from './route-constants.js'
import { isValidSearchTerm, hasSearchResult } from '../services/search-service.js'

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
  handler: (_request, h) => {
    return h.view(viewTemplate)
  }
},
{
  method: 'POST',
  path: paths.SEARCH,
  options: {
    auth: false,
    validate: {
      payload: validSearchTermSchema,
      failAction: async (_request, h, err) => {
        return h.view(
          viewTemplate,
          { searchTerm: _request.payload.searchTerm, isValid: false, errorCode: INVALID_SEARCH_TERM }).takeover()
      }
    }
  },
  handler: async (_request, h) => {
    const searchTerm = _request.payload.searchTerm
    const searchTermFound = await hasSearchResult(searchTerm)

    if (!searchTermFound) {
      return h.view(
        viewTemplate,
        { searchTerm: _request.payload.searchTerm, isValid: false, errorCode: SEARCH_TERM_NOT_FOUND })
    }
    return h.redirect(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm}`)
  }
}
]
