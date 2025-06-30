import { config } from '../config/config.js'

export const cookieBanner = {
  name: 'cookie-banner',
  async register (server) {
    server.state('cookie_policy', {
      isSecure: config.get('env') !== 'development'
    })

    server.ext('onPreHandler', (request, h) => {
      if (!request.query['cookies[additional]']) {
        return h.continue
      }

      const cookiePolicy = JSON.stringify({ analytics: request.query['cookies[additional]'] === 'yes' })
      h.state('cookie_policy', cookiePolicy)
      request.app.cookiePolicy = cookiePolicy

      return h.continue
    })
  }
}
