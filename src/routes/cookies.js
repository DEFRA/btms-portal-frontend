import { paths } from './route-constants.js'

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
  handler: (request, h) => {
    const { 'cookies[additional]': acceptAdditionalCookies, previousUrl } = request.payload
    if (acceptAdditionalCookies === undefined) {
      return h.view('cookies')
    }

    const acceptedCookies = acceptAdditionalCookies === 'yes'

    h.state('cookie_policy', JSON.stringify({ analytics: acceptedCookies }))

    if (previousUrl !== undefined) {
      return h.redirect(`${previousUrl}?cookieBannerConfirmation=true`)
    }

    return h.view('cookies', { acceptedCookies, cookiePageConfirmation: true })
  }
}
