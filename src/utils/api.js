import wreck from '@hapi/wreck'
import { config } from '../config/config.js'

export class ApiClient {
  constructor (apiConfig) {
    this.baseUrl = apiConfig.baseUrl
    this.basicCredentials = Buffer.from(`${apiConfig.username}:${apiConfig.password}`).toString('base64')
    this.headers = { authorization: `Basic ${this.basicCredentials}` }
  }

  getHeaders (additionalHeaders = {}) {
    const headers = { ...this.headers, ...additionalHeaders }

    return config.get('cdpApiKey') ? withCdpApiKey(headers) : headers
  }

  async get (endpoint) {
    const { payload } = await wreck.get(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      json: 'force'
    })

    return payload
  }

  async getStream (endpoint, additionalHeaders = {}) {
    return wreck.request('get', `${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders(additionalHeaders)
    })
  }

  async post (endpoint) {
    const { res } = await wreck.post(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    })

    return res
  }
}

const withCdpApiKey = (headers) => ({ ...headers, 'x-api-key': config.get('cdpApiKey') })
