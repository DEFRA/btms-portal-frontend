import { constants } from 'node:http2'

const {
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} = constants

const titles = {
  [HTTP_STATUS_UNAUTHORIZED]: 'Sign in',
  [HTTP_STATUS_FORBIDDEN]: 'You do not have the correct permissions to access this service',
  [HTTP_STATUS_NOT_FOUND]: 'Page not found'
}

const paragraphs = {
  [HTTP_STATUS_UNAUTHORIZED]: ['You need to sign in to this service.'],
  [HTTP_STATUS_FORBIDDEN]: ['Contact your organisation’s administrator if you need access.'],
  [HTTP_STATUS_NOT_FOUND]: [
    'If you typed the web address, check it is correct.',
    'If you pasted the web address, check you copied the entire address.'
  ]
}

export const errorPage = {
  name: 'error-page',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (!response.isBoom) {
        return h.continue
      }

      const { statusCode } = response.output

      if (statusCode >= HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        request.logger.error(response.stack)
        if (response.data) {
          request.logger.error(response.data)
        }
      }

      const heading = titles[statusCode] || 'Sorry, there is a problem with this service'
      const messages = paragraphs[statusCode] || ['Try again later.']

      return h.view('error', { heading, hideCookieBanner: true, messages })
        .code(statusCode)
    })
  }
}
