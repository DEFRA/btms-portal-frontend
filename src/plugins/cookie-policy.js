import { config } from '../config/config.js'

const oneYearInDaysForSonar = 365
const oneYearInMilliseconds = 60 * 60 * 24 * oneYearInDaysForSonar * 1000

export const cookiePolicy = {
  name: 'cookie-policy',
  async register (server) {
    server.state('cookiePolicy', {
      clearInvalid: true,
      encoding: 'base64json',
      isSecure: config.get('isProduction'),
      ttl: oneYearInMilliseconds
    })

    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        const [showCookieConfirmationBanner] = request.yar.flash(
          'showCookieConfirmationBanner'
        )

        response.source.context = {
          ...response.source.context,
          showCookieConfirmationBanner,
          cookiePolicy: request.state.cookiePolicy
        }
      }

      return h.continue
    })
  }
}
