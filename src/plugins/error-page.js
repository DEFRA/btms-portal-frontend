import { constants as httpConstants } from 'http2'

const getErrorMessage = (statusCode) => {
  switch (statusCode) {
    case httpConstants.HTTP_STATUS_NOT_FOUND:
      return 'Page not found'
    case httpConstants.HTTP_STATUS_FORBIDDEN:
      return 'Forbidden'
    case httpConstants.HTTP_STATUS_UNAUTHORIZED:
      return 'Unauthorized'
    case httpConstants.HTTP_STATUS_BAD_REQUEST:
      return 'Bad Request'
    default:
      return 'Something went wrong'
  }
}

const serveFriendlyErrorPage = (request, h) => {
  const response = request.response
  const statusCode = response.output.statusCode
  const errorMessage = getErrorMessage(statusCode)

  if (statusCode >= httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR) {
    request.logger.error(response?.stack)
  }

  return h
    .view('error', {
      pageTitle: errorMessage,
      heading: statusCode,
      message: errorMessage
    })
    .code(statusCode)
}
export const errorPage = {
  name: 'error-page',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      if (!request.response.isBoom) {
        return h.continue
      }
      return serveFriendlyErrorPage(request, h)
    })
  }
}
