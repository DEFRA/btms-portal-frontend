import { config } from '../config/config.js'

const getQueryString = (searchParams) =>
  searchParams.size > 0 ? `?${searchParams}` : ''

const backLinkPages = new Set([
  '/reporting',
  '/cookies',
  '/accessibility-statement'
])

const getBackLink = (request, searchParams) => {
  const isBackLinkPage = backLinkPages.has(request.path)
  const current = request.yar.get('current')
  const history = request.yar.get('history') || []
  const backLink = searchParams.get('backLink')

  const queryString = getQueryString(searchParams)
  const target = {
    path: request.path,
    queryString
  }

  request.yar.set('current', target)

  if (!isBackLinkPage) {
    request.yar.set('history', [])
    return null
  }

  if (backLink && isBackLinkPage) {
    history.pop()
  }

  if (!backLink && current !== null && target.path !== current.path) {
    history.push(current)
  }

  request.yar.set('history', history)

  if (history.length === 0) {
    return { text: 'Search', href: '/search' }
  }

  const previous = history.at(-1)
  const previousSearchParams = new URLSearchParams(previous.queryString)
  previousSearchParams.set('backLink', 'true')

  const previousQuery = getQueryString(previousSearchParams)

  return { text: 'Back', href: `${previous.path}${previousQuery}` }
}

export const commonViewContext = {
  name: 'common-view-context',
  async register(server) {
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        const query = request.orig.query || request.query

        const searchParams = new URLSearchParams(query)
        const queryString = getQueryString(searchParams)
        const backLink = getBackLink(request, searchParams)
        const { isAuthenticated } = request.auth

        response.source.context = {
          ...response.source.context,
          cspNonce: request.app.cspNonce,
          currentUrl: `${request.path}${queryString}`,
          gtmId: config.get('gtmId'),
          isAuthenticated,
          backLink
        }
      }

      return h.continue
    })
  }
}
