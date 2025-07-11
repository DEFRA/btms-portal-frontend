import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { HttpsProxyAgent } from 'https-proxy-agent'

const wreckProxyConfiguration = {
  name: 'wreck-proxy-configuration',
  async register () {
    const proxyUrl = config.get('httpsProxy') ?? config.get('httpProxy')

    if (proxyUrl) {
      const httpsAgent = new HttpsProxyAgent(proxyUrl)

      Wreck.agents.http = httpsAgent
      Wreck.agents.https = httpsAgent
      Wreck.agents.httpsAllowUnauthorized = httpsAgent
    }
  }
}

export { wreckProxyConfiguration }
