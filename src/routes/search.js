import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'

export const search = {
  method: 'get',
  path: paths.SEARCH,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: (request, h) => {
    const [searchError] = request.yar.flash('searchError')

    return h.view('search', searchError)
  }
}
