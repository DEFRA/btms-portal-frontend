import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const decisionDeriverConfig = config.get('decisionDeriver')
const decisionDeriverClient = new ApiClient(decisionDeriverConfig)

export const getDlqCount = async (dlqCountEndpoint) =>
  decisionDeriverClient.get(dlqCountEndpoint)
