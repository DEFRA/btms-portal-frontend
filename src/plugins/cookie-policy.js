import { config } from '../config/config.js'

const oneYearInDaysForSonar = 365
const oneYearInMilliseconds = 60 * 60 * 24 * oneYearInDaysForSonar * 1000

export const cookiePolicy = {
  name: 'cookie-policy',
  async register (server) {
    server.state('cookie_policy', {
      encoding: 'base64json',
      isSecure: config.get('isProduction'),
      ttl: oneYearInMilliseconds
    })

    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        response.source.context = {
          ...response.source.context,
          cookieBannerConfirmation: request.query.cookieBannerConfirmation,
          cookiePolicy: request.state?.cookie_policy
        }
      }

      return h.continue
    })
  }
}
