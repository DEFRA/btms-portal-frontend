import { paths } from './route-constants.js'
import Joi from 'joi'

export const cookiesGet = {
  method: 'GET',
  path: paths.COOKIES,
  handler: (_, h) => {
    return h.view('cookies')
  }
}

export const cookiesPost = {
  method: 'POST',
  path: paths.COOKIES,
  options: {
    validate: {
      payload: Joi.object({
        'cookies[analytics]': Joi.string().valid('yes', 'no').required(),
        previousUrl: Joi.string().required()
      }),
      options: {
        allowUnknown: true
      }
    }
  },
  handler: (request, h) => {
    const { 'cookies[analytics]': acceptAnalyticsCookies, previousUrl } =
      request.payload
    const acceptedCookies = acceptAnalyticsCookies === 'yes'

    h.state('cookie_policy', { analytics: acceptedCookies })

    if (previousUrl === '/cookies') {
      return h.view('cookies', {
        acceptedCookies,
        cookiePageConfirmation: true
      })
    }

    return h.redirect(`${previousUrl}?cookieBannerConfirmation=true`)
  }
}
