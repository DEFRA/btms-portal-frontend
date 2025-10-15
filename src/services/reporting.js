import wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { authorization } from './reporting-auth.js'

const { baseUrl } = config.get('btmsReportingApi')

export const getReports = async (request, from, to, intervals) => {
  const query = new URLSearchParams({ from, to })

  for (const interval of intervals) {
    const timestamp = new Date(to) > new Date(interval) ? interval : to
    query.append('intervals', timestamp)
  }

  try {
    const { payload } = await wreck.get(`${baseUrl}/intervals?${query}`, {
      headers: { authorization },
      json: 'strict'
    })

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}

export const getLatestActivity = async (request) => {
  try {
    const [lastSent, lastReceived] = await Promise.all([
      wreck.get(`${baseUrl}/last-sent`, {
        headers: { authorization },
        json: 'strict'
      }),
      wreck.get(`${baseUrl}/last-received`, {
        headers: { authorization },
        json: 'strict'
      })
    ])

    return {
      lastSent: lastSent.payload,
      lastReceived: lastReceived.payload
    }
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
