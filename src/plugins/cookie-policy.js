import { config } from '../config/config.js'

const oneYearInDaysForSonar = 365
const oneYearInMilliseconds = 60 * 60 * 24 * oneYearInDaysForSonar * 1000

const parseCookiePolicy = cookiePolicyJson => {
  try {
    return cookiePolicyJson ? JSON.parse(cookiePolicyJson) : undefined
  } catch (e) { // NOSONAR - Users can set whatever they want in a cookie, don't error if it's not valid
    return undefined
  }
}

export const cookiePolicy = {
  name: 'cookie-policy',
  async register (server) {
    server.state('cookie_policy', {
      isSecure: config.get('isProduction'),
      ttl: oneYearInMilliseconds
    })

    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        response.source.context = {
          ...response.source.context,
          cookieBannerConfirmation: request.query.cookieBannerConfirmation,
          cookiePolicy: parseCookiePolicy(request.state?.cookie_policy)
        }
      }

      return h.continue
    })
  }
}
