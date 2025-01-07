import { constants as httpConstants } from 'http2'

export const health = {
  method: 'GET',
  path: '/health',
  handler: (_request, h) => {
    return h.response({ message: 'success' }).code(httpConstants.HTTP_STATUS_OK)
  }
}
