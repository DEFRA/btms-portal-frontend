import { constants as httpConstants } from 'http2'
import { noCache } from './cache-constants.js'
import { paths } from './route-constants.js'

export const health = {
  method: 'GET',
  path: paths.HEALTH,
  options: {
    cache: noCache
  },
  handler: (_request, h) => {
    return h.response({ message: 'success' }).code(httpConstants.HTTP_STATUS_OK)
  }
}
