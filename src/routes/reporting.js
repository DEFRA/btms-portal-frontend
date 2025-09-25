import { dateRange } from './schemas/date-range.js'
import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getSummary } from '../services/reporting.js'
import { mapReports } from '../models/reports.js'
import { format } from 'date-fns'
import {
  formatDayInPast,
  formatToday,
  formatYesterday,
  formatReportingDate
} from '../utils/dates.js'

const getQueryString = (startDate, endDate) =>
  new URLSearchParams({
    startDate,
    endDate
  }).toString()

const dateFormat = 'd/M/yyyy'

const getDateProps = () => {
  const daysToLastWeek = 6
  const daysToLastMonth = 29

  const todaysDate = formatToday()
  const today = getQueryString(todaysDate, todaysDate)
  const yesterdaysDate = formatYesterday()
  const yesterday = getQueryString(yesterdaysDate, yesterdaysDate)
  const lastWeekDate = formatDayInPast(daysToLastWeek)
  const lastWeek = getQueryString(lastWeekDate, todaysDate)
  const lastMonthDate = formatDayInPast(daysToLastMonth)
  const lastMonth = getQueryString(lastMonthDate, todaysDate)

  return {
    todaysDate,
    today,
    yesterday,
    lastWeek,
    lastMonth
  }
}

export const reporting = {
  method: 'get',
  path: paths.REPORTING,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      query: dateRange.unknown(),
      failAction: async (request, h, error) => {
        request.logger.setBindings({ error })

        const requiredMessage = {
          startDate: 'Enter a start date',
          endDate: 'Enter an end date'
        }

        const filteredErrors = error.details.filter(
          ({ type }) => type !== 'any.ref'
        )

        const errors = filteredErrors.reduce((errs, detail) => {
          if (detail.type === 'date.format' && detail.context.value === '') {
            errs[detail.context.key] = requiredMessage[detail.context.key]

            return errs
          }

          errs[detail.context.key] = detail.message

          return errs
        }, {})

        const errorList = filteredErrors.map((detail) => {
          const text =
            detail.type === 'date.format' && detail.context.value === ''
              ? requiredMessage[detail.context.key]
              : detail.message

          return {
            text,
            href: `#${detail.context.key}`
          }
        })

        const dateProps = getDateProps()
        return h
          .view('reporting', {
            ...request.query,
            ...dateProps,
            errors,
            errorList
          })
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const { startDate, endDate } = request.query

    const summary = await getSummary(request, startDate, endDate)
    const reports = mapReports(summary)

    const fromPeriod = formatReportingDate(startDate)
    const toPeriod = formatReportingDate(endDate)
    const timePeriod = `${fromPeriod} to ${toPeriod}`

    const csvQuery = getQueryString(
      format(startDate, dateFormat),
      format(endDate, dateFormat)
    )
    const dateProps = getDateProps()

    return h.view('reporting', {
      reports,
      ...dateProps,
      csvQuery,
      timePeriod,
      startDate: format(startDate, dateFormat),
      endDate: format(endDate, dateFormat)
    })
  }
}
