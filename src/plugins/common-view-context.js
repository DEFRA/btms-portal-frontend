import { config } from '../config/config.js'

export const commonViewContext = {
  name: 'common-view-context',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        response.source.context = {
          ...response.source.context,
          cspNonce: request.app.cspNonce,
          currentUrl: request.path,
          gtmId: config.get('gtmId')
        }
      }

      return h.continue
    })
  }
}
