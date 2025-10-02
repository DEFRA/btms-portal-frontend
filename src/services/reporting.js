import wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { authorization } from './reporting-auth.js'
import { getFromAndTo } from '../utils/dates.js'

const { baseUrl } = config.get('btmsReportingApi')

export const getSummary = async (request, startDate, endDate) => {
  const [from, to] = getFromAndTo(startDate, endDate)

  const query = new URLSearchParams({ from, to })
  try {
    const { payload } = await wreck.get(`${baseUrl}/summary?${query}`, {
      headers: { authorization },
      json: 'strict'
    })

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
