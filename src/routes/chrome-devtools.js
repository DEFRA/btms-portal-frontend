import { constants } from 'http2'
import { paths } from './route-constants.js'

export const chromeDevtools = {
  method: 'GET',
  path: paths.CHROME_DEVTOOLS,
  handler: (_request, h) => {
    return h.response({ message: 'success' }).code(constants.HTTP_STATUS_NO_CONTENT)
  }
}
