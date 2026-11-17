import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const reportingApiConfig = config.get('btmsReportingApi')
const reportingApiClient = new ApiClient(reportingApiConfig)

export const getReports = async (request, from, to, intervals) => {
  const query = new URLSearchParams({ from, to })

  for (const interval of intervals) {
    const timestamp = new Date(to) > new Date(interval) ? interval : to
    query.append('intervals', timestamp)
  }

  try {
    const payload = await reportingApiClient.get(`intervals?${query}`)

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}

export const getMatchingReports = async (request, from , to) => {
  const query = new URLSearchParams({ from, to })

  try {
    const payload = await reportingApiClient.get(`matches/summary/levels-by-region?${query}`)

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}

export const getLatestActivity = async (request) => {
  try {
    const [lastCreated, lastSent, lastReceived] = await Promise.all([
      reportingApiClient.get('last-created'),
      reportingApiClient.get('last-sent'),
      reportingApiClient.get('last-received')
    ])

    return {
      lastCreated,
      lastSent,
      lastReceived
    }
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}

export const getDlqCount = async (dlqCountEndpoint) =>
  reportingApiClient.get(dlqCountEndpoint)

export const postReportingRedrive = async (redriveEndpoint) =>
  reportingApiClient.post(redriveEndpoint)

export const postReportingDrain = async (drainEndpoint) =>
  reportingApiClient.post(drainEndpoint)
