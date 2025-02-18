import Joi from 'joi'
import { paths, queryStringParams } from './route-constants.js'
import { isValidSearchTerm } from '../services/search-service.js'

const viewTemplate = 'search'

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
      payload: Joi.object({
        searchTerm: Joi.string().required().custom((value, helpers) => {
          if (!isValidSearchTerm(value)) {
            return helpers.error('any.invalid')
          }
          return value
        })
      }),
      failAction: async (_request, h) => {
        console.log('fail action triggered')
        return h.view(
          viewTemplate,
          { searchTerm: _request.payload.searchTerm, isValid: false }).takeover()
      }
    }
  },
  handler: (_request, h) => {
    const searchTerm = _request.payload.searchTerm
    return h.redirect(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm}`)
  }
}
]
