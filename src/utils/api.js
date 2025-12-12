import wreck from '@hapi/wreck'

export class ApiClient {
  constructor (apiConfig) {
    this.baseUrl = apiConfig.baseUrl
    this.basicCredentials = Buffer.from(`${apiConfig.username}:${apiConfig.password}`).toString('base64')
  }

  async get (endpoint) {
    const { payload } = await wreck.get(`${this.baseUrl}/${endpoint}`, {
      headers: { authorization: `Basic ${this.basicCredentials}` },
      json: 'force'
    })

    return payload
  }
}
