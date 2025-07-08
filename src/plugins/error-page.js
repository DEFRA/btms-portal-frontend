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

const getCircularReplacer = () => {
  const ancestors = []
  return function (key, value) {
    if (typeof value !== 'object' || value === null) {
      return value
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop()
    }
    if (ancestors.includes(value)) {
      return '[Circular]'
    }
    ancestors.push(value)
    return value
  }
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
          request.logger.error(JSON.stringify(response.data, getCircularReplacer()))
        }
      }

      const heading = titles[statusCode] || 'Sorry, there is a problem with this service'
      const messages = paragraphs[statusCode] || ['Try again later.']

      return h.view('error', { heading, hideCookieBanner: true, messages })
        .code(statusCode)
    })
  }
}
