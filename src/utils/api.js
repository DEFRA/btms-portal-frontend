import wreck from '@hapi/wreck'
import { config } from '../config/config.js'

export class ApiClient {
  constructor (apiConfig) {
    this.baseUrl = apiConfig.baseUrl
    this.basicCredentials = Buffer.from(`${apiConfig.username}:${apiConfig.password}`).toString('base64')
    this.headers = { authorization: `Basic ${this.basicCredentials}` }
  }

  async get (endpoint) {
    const headers = config.get('cdpApiKey') ? withCdpApiKey(this.headers) : this.headers

    const { payload } = await wreck.get(`${this.baseUrl}/${endpoint}`, {
      headers,
      json: 'force'
    })

    return payload
  }
}

const withCdpApiKey = (headers) => ({ ...headers, 'x-api-key': config.get('cdpApiKey') })
