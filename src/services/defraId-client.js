import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import Querystring from 'querystring'

const logger = createLogger()

const provideWreck = () => {
  const proxyUrl = config.get('httpsProxy') ?? config.get('httpProxy')

  if (!proxyUrl) {
    logger.info('No proxy configuration set')
    return Wreck
  }

  logger.info(`Configured Proxy: ${proxyUrl}`)

  const httpsAgent = new HttpsProxyAgent(proxyUrl)

  const proxiedWreck = Wreck.defaults({
    agents: {
      https: httpsAgent,
      http: httpsAgent,
      httpsAllowUnauthorized: httpsAgent
    }
  })

  return proxiedWreck
}

const getDefraIdAuthConfig = async (oidcConfigurationUrl) => {
  const wreck = provideWreck()

  const { payload } = await wreck.get(oidcConfigurationUrl, {
    json: 'strict'
  })

  return payload
}

const getDefraIdRefreshToken = async (refreshUrl, params) => {
  const wreck = provideWreck()

  return wreck.post(refreshUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    payload: Querystring.stringify(params)
  })
}

export {
  getDefraIdAuthConfig,
  getDefraIdRefreshToken
}
