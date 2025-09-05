import wreck from '@hapi/wreck'
import { config } from '../config/config.js'

const { baseUrl, password, username } = config.get('btmsReportingApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')

const calculatePercentage = (part, total) => {
  if (total === 0) {
    return '0.00'
  }
  return ((part / total) * 100).toFixed(2)
}

export const getSummary = async (request, from, to) => {
  try {
    const { payload } = await wreck.get(
      `${baseUrl}/summary?from=${from}&to=${to}`,
      {
        headers: { authorization: `Basic ${token}` },
        json: 'strict'
      }
    )

    return {
      releases: {
        ...payload.releases,
        manualPercentage: calculatePercentage(payload.releases.manual, payload.releases.total),
        automaticPercentage: calculatePercentage(payload.releases.automatic, payload.releases.total)
      },
      matches: payload.matches
    }
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
