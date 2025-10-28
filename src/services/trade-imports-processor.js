import { config } from '../config/config.js'
import { getWithErrorHandling } from '../utils/api.js'

const { baseUrl, password, username } = config.get('tradeImportsProcessor')
const token = Buffer.from(`${username}:${password}`).toString('base64')

const get = getWithErrorHandling(token)

export const getRawMessages = (request, resourceId) =>
  get(request, `${baseUrl}/raw-messages?resourceId=${resourceId}`)
