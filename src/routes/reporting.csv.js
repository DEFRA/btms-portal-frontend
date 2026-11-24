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
  LEVEL_MATCHING_CSV,
  CUSTOMS_DECLARATIONS_CSV,
  IPAFFS_CHEDS_CSV,
  TRACES_CHEDS_CSV
} from './route-constants.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { EU_COUNTRY_CODES } from '../models/model-constants.js'
import { csvValue } from '../utils/csv.js'

const createHandler = (reports) => {
  return async (request, h) => {
    const { name } = request.params
    const { startDate, endDate } = request.query
    const { mapRowHandler, headers, useV2 = false } = reports[name]

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
    format(new Date(value.timestamp), 'dd MMMM yy, HH:mm')
  ].map(csvValue).join(',') + '\n'
}

const reportHeaders = 'MRN,Last updated\n'

const reportingReports = {
  [NO_MATCH_CSV]: {
    mapRowHandler: reportMapRowHandler,
    headers: reportHeaders
  },
  [MANUAL_RELEASE_CSV]: {
    mapRowHandler: reportMapRowHandler,
    headers: reportHeaders
  }
}

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
  handler: createHandler(reportingReports)
}

const customsDeclarationMapRowHandler = (value) => {
  return [
    value.mrn,
    value.mrnCreated,
    value.lastUpdated,
    value.releaseType,
    value.finalState,
    value.dispatchCountryCode,
    value.itemNumber,
    value.commodityCode,
    value.description,
    value.quantityOrWeight,
    value.chedReferences,
    value.authorities,
    value.checkCodes,
    value.decisions,
    value.match
  ].map(csvValue).join(',') + '\n'
}

const customsDeclarationHeaders = 'MRN,MRN created,Last updated,Release type,Final state,Dispatch country code,Item number,Commodity code,Description,Quantity/Weight,CHED references,Authorities,Check codes,Decisions,Match\n'

const chedMapRowHandler = (value) => {
  return [
    value.chedReference,
    value.chedType,
    value.status,
    value.created,
    value.updated,
    value.commodityCode,
    value.description
  ].map(csvValue).join(',') + '\n'
}

const chedHeaders = 'CHED reference,CHED type,Status,Created,Last updated,Commodity code,Description\n'

const restrictedReportMapRowHandler = (value) => {
  return [
    value.level,
    format(new Date(value.timestamp), 'dd MMMM yy, HH:mm'),
    value.mrn,
    value.itemNumber,
    value.commodityCode,
    value.checkCode,
    value.description,
    value.quantityOrWeight,
    value.chedReference,
    value.match,
    value.authority,
    value.decision,
    value.decisionReasons,
    value.declarantId,
    value.dispatchCountryCode,
    EU_COUNTRY_CODES.has(value.dispatchCountryCode?.toUpperCase()) ? 'EU' : 'RoW'
  ].map(csvValue).join(',') + '\n'
}

const restrictedReportHeaders = 'Level,Last updated,MRN,Item number,Commodity code,Check code,Description,Quantity/Weight,CHED reference,Match,Authority,Decision,Decision reason,EORI Number,Country Code,Country Region (EU or RoW)\n'

const restrictedReports = {
  [LEVEL_MATCHING_CSV]: {
    mapRowHandler: restrictedReportMapRowHandler,
    headers: restrictedReportHeaders,
    useV2: true
  },
  [CUSTOMS_DECLARATIONS_CSV]: {
    mapRowHandler: customsDeclarationMapRowHandler,
    headers: customsDeclarationHeaders
  },
  [IPAFFS_CHEDS_CSV]: {
    mapRowHandler: chedMapRowHandler,
    headers: chedHeaders
  },
  [TRACES_CHEDS_CSV]: {
    mapRowHandler: chedMapRowHandler,
    headers: chedHeaders
  }
}

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
        name: joi.string().valid(
          LEVEL_MATCHING_CSV,
          CUSTOMS_DECLARATIONS_CSV,
          IPAFFS_CHEDS_CSV,
          TRACES_CHEDS_CSV
        )
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
  handler: createHandler(restrictedReports)
}
