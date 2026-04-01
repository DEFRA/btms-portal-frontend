import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const btmsGatewayConfig = config.get('btmsGateway')
const gatewayClient = new ApiClient(btmsGatewayConfig)

export const getDlqCount = async (dlqCountEndpoint) =>
  gatewayClient.get(dlqCountEndpoint)

export const postBtmsGatewayRedrive = async (redriveEndpoint) =>
  gatewayClient.post(redriveEndpoint)
