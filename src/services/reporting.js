import wreck from '@hapi/wreck'
import { config } from '../config/config.js'

const { baseUrl, password, username } = config.get('btmsReportingApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')

export const getSummary = async (request, from, to) => {
  try {
    const { payload } = await wreck.get(
      `${baseUrl}/summary?from=${from}&to=${to}`,
      {
        headers: { authorization: `Basic ${token}` },
        json: 'strict'
      }
    )

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
