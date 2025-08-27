import { paths } from './route-constants.js'
import joi from 'joi'

export const cookiesGet = {
  method: 'get',
  path: paths.COOKIES,
  handler: (request, h) => {
    const [error] = request.yar.flash('cookiesError')
    return h.view('cookies', { error })
  }
}

export const cookiesPost = {
  method: 'post',
  path: paths.COOKIES,
  options: {
    validate: {
      payload: joi
        .object({
          analytics: joi.string().valid('yes', 'no').required(),
          previousUrl: joi.string().required()
        })
        .unknown(),
      failAction: (request, h) => {
        request.yar.flash('cookiesError', true)

        return h.redirect(paths.COOKIES).takeover()
      }
    }
  },
  handler: (request, h) => {
    const { analytics, previousUrl } = request.payload
    h.state('cookiePolicy', { analytics })

    request.yar.flash('showCookieConfirmationBanner', true)
    return h.redirect(previousUrl)
  }
}
