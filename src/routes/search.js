import { paths, queryStringParams } from './route-constants.js'
export const search = [{
  method: 'GET',
  path: paths.SEARCH,
  handler: (_request, h) => {
    return h.view('search')
  }
},
{
  method: 'POST',
  path: paths.SEARCH,
  handler: (_request, h) => {
    const searchTerm = _request.payload.searchTerm
    return h.redirect(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm}`)
  }
}
]
