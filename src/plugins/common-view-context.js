import { config } from '../config/config.js'

export const commonViewContext = {
  name: 'common-view-context',
  async register(server) {
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        const query = request.orig.query || request.query

        const searchParams = new URLSearchParams(query)
        const queryString = searchParams.size > 0 ? `?${searchParams}` : ''
        const { isAuthenticated } = request.auth

        response.source.context = {
          ...response.source.context,
          cspNonce: request.app.cspNonce,
          currentUrl: `${request.path}${queryString}`,
          gtmId: config.get('gtmId'),
          isAuthenticated
        }
      }

      return h.continue
    })
  }
}
