import wreck from '@hapi/wreck'
import { format } from 'date-fns'
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

const latestActivityMessage = (type, timestamp) => ({
  type,
  timestamp: format(new Date(timestamp), 'dd MMMM yyyy, HH:mm')
})

export const getLatestActivity = async () => {
  const { payload: lastSentPayload } = await wreck.get(`${baseUrl}/last-sent`, {
    headers: { authorization },
    json: 'strict'
  })

  const { payload: lastReceivedPayload } = await wreck.get(`${baseUrl}/last-received`, {
    headers: { authorization },
    json: 'strict'
  })

  return {
    services: [
      {
        name: 'BTMS',
        direction: 'sent',
        messages: [
          latestActivityMessage('Decision', lastSentPayload.decision.timestamp)
        ]
      },
      {
        name: 'CDS',
        direction: 'received',
        messages: [
          latestActivityMessage('Clearance request', lastReceivedPayload.clearanceRequest.timestamp),
          latestActivityMessage('Finalisation', lastReceivedPayload.finalisation.timestamp)
        ]
      },
      {
        name: 'IPAFFS',
        direction: 'received',
        messages: [
          latestActivityMessage('Notification', lastReceivedPayload.preNotification.timestamp)
        ]
      }
    ]
  }
}
