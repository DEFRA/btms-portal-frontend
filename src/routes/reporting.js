import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getSummary } from '../services/reporting.js'
import { mapReports } from '../models/reports.js'

export const reporting = {
  method: 'get',
  path: paths.REPORTING,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    )

    const from = yesterday.toISOString()
    const to = today.toISOString()

    const summary = await getSummary(request, from, to)
    const reports = mapReports(summary)

    const timePeriod = 'yesterday'
    return h.view('reporting', { reports, timePeriod })
  }
}
