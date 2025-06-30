const parseCookiePolicy = cookiePolicy => {
  try {
    return cookiePolicy ? JSON.parse(cookiePolicy) : undefined
  } catch (e) { // NOSONAR - Users can set whatever they want in a cookie, don't error if it's not valid
    return undefined
  }
}

export const commonViewContext = {
  name: 'common-view-context',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        response.source.context = {
          ...response.source.context,
          cspNonce: request.app.cspNonce,
          cookiePolicy: parseCookiePolicy(request.state?.cookie_policy)
        }
      }

      return h.continue
    })
  }
}
