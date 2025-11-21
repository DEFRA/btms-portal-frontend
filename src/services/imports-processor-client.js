import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const processorApiConfig = config.get('btmsImportsProcessor')
const processorApiClient = new ApiClient(processorApiConfig)

export const getRawMessages = (resourceId) =>
  processorApiClient.get(`raw-messages?resourceId=${resourceId}`)
