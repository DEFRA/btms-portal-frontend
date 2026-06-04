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
  MANUAL_RELEASE_CSV,
  LEVEL_MATCHING_CSV
} from './route-constants.js'
import { APP_SCOPES } from '../auth/auth-constants.js'

const createHandler = (mapRowHandler, headers, useV2 = false) => {
  return async (request, h) => {
    const { name } = request.params
    const { startDate, endDate } = request.query

    const res = await getReportingCsv(request, useV2)
    const csv = mapReportsCsv(res, name, startDate, endDate, mapRowHandler, headers)

    const from = format(startDate, 'yyyy.MM.dd')
    const to = format(endDate, 'yyyy.MM.dd')

    const filename = name.replace('.csv', `-${from}-${to}.csv`)
    return h
    .response(csv)
    .type('text/csv')
    .header('content-disposition', `attachment; filename="${filename}"`)
  }
}

const reportMapRowHandler = (value) => {
  return [
    value.reference,
    `"${format(new Date(value.timestamp), 'dd MMMM yy, HH:mm')}"`
  ].join(',') + '\n'
}

const reportHeaders = 'MRN,Last updated\n'

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
  handler: createHandler(reportMapRowHandler, reportHeaders)
}

const restrictedReportMapRowHandler = (value) => {
  return [
    value.level,
    `"${format(new Date(value.timestamp), 'dd MMMM yy, HH:mm')}"`,
    value.mrn,
    value.itemNumber,
    value.commodityCode,
    value.checkCode,
    `"${value.description}"`,
    value.quantityOrWeight,
    value.chedReference,
    value.match,
    value.authority,
    value.decision,
    `"${value.decisionReasons ?? ""}"`,
    value.declarantId,
    value.dispatchCountryCode
  ].join(',') + '\n'
}

const restrictedReportHeaders = 'Level,Last updated,MRN,Item number,Commodity code,Check code,Description,Quantity/Weight,CHED reference,Match,Authority,Decision,Decision reason,EORI Number,Country Code\n'

export const restrictedReportingCsv = {
  method: 'get',
  path: paths.RESTRICTED_REPORTING_CSV,
  options: {
    auth: {
      scope: [APP_SCOPES.ADMIN],
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      params: joi.object({
        name: joi.string().valid(LEVEL_MATCHING_CSV)
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
  handler: createHandler(restrictedReportMapRowHandler, restrictedReportHeaders, true)
}
