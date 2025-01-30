export const search = [{
  method: 'GET',
  path: '/search',
  handler: (_request, h) => {
    return h.view('search', {
      pageTitle: 'Search - Border Trade Matching Service',
      heading: 'Search by MRN or CHED'
    })
  }
},
{
  method: 'POST',
  path: '/search',
  handler: (_request, h) => {
    const searchTerm = _request.payload.searchTerm
    return h.redirect(`/search-result?searchTerm=${searchTerm}`)
  }
}
]
