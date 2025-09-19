import wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { addMilliseconds } from 'date-fns'

const { baseUrl, password, username } = config.get('btmsReportingApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')
const oneMillisecond = 1

export const getSummary = async (request, startDate, endDate) => {
  const from = startDate.toISOString()
  const to = addMilliseconds(endDate, oneMillisecond).toISOString()

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
