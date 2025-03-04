import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import Querystring from 'querystring'

const logger = createLogger()

const getAgents = () => {
  const proxyUrl = config.get('httpsProxy') ?? config.get('httpProxy')

  if (!proxyUrl) {
    logger.info('No proxy configuration set')
    return Wreck.agents
  }

  logger.info(`Configured Proxy: ${proxyUrl}`)

  const httpsAgent = new HttpsProxyAgent(proxyUrl)

  const agents = {
    https: httpsAgent,
    http: httpsAgent,
    httpsAllowUnauthorized: httpsAgent
  }

  return agents
}

Wreck.defaults({
  agents: getAgents()
})

const getDefraIdAuthConfig = async (oidcConfigurationUrl) => {
  const { payload } = await Wreck.get(oidcConfigurationUrl, {
    json: 'strict'
  })

  return payload
}

const getDefraIdRefreshToken = async (refreshUrl, params) => {
  return Wreck.post(refreshUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    payload: Querystring.stringify(params)
  })
}

export {
  getAgents,
  getDefraIdAuthConfig,
  getDefraIdRefreshToken
}
