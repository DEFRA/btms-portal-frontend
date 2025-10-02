import joi from 'joi'
import boom from '@hapi/boom'
import { dateRange } from './schemas/date-range.js'
import { getReportingCsv } from '../services/reporting.csv.js'
import { mapReportsCsv } from '../models/reports-csv.js'
import { format } from 'date-fns'
import {
  paths,
  CACHE_CONTROL_NO_STORE,
  NO_MATCH_CSV,
  MANUAL_RELEASE_CSV
} from './route-constants.js'

export const reportingCsv = {
  method: 'get',
  path: paths.REPORTING_CSV,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      params: joi.object({
        name: joi.string().valid(NO_MATCH_CSV, MANUAL_RELEASE_CSV)
      }),
      query: dateRange,
      failAction: (_, __, error) => {
        const [err] = error.details
        if (err.type === 'any.only') {
          throw boom.notFound()
        }
        throw boom.badRequest()
      }
    }
  },
  handler: async (request, h) => {
    const { name } = request.params
    const { startDate, endDate } = request.query

    const res = await getReportingCsv(request)
    const csv = mapReportsCsv(res, name, startDate, endDate)

    const from = format(startDate, 'yyyy.MM.dd')
    const to = format(endDate, 'yyyy.MM.dd')

    const filename = name.replace('.csv', `-${from}-${to}.csv`)
    return h
      .response(csv)
      .type('text/csv')
      .header('content-disposition', `attachment; filename="${filename}"`)
  }
}
