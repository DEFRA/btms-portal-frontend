import { dateRange } from './schemas/date-range.js'
import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getReports } from '../services/reporting.js'
import { mapReports } from '../models/reports.js'
import { format } from 'date-fns'
import {
  getFromAndTo,
  getIntervals,
  formatDayInPast,
  formatToday,
  formatYesterday,
  formatReportingDate
} from '../utils/dates.js'

const getQueryString = (startDate, endDate, tab) => {
  const query = new URLSearchParams({
    startDate,
    endDate
  })
  if (tab) {
    query.set('tab', tab)
  }
  return query
}

const dateFormat = 'd/M/yyyy'

const getDateProps = (tab) => {
  const daysToLastWeek = 6
  const daysToLastMonth = 29

  const todaysDate = formatToday()
  const today = getQueryString(todaysDate, todaysDate, tab)
  const yesterdaysDate = formatYesterday()
  const yesterday = getQueryString(yesterdaysDate, yesterdaysDate, tab)
  const lastWeekDate = formatDayInPast(daysToLastWeek)
  const lastWeek = getQueryString(lastWeekDate, todaysDate, tab)
  const lastMonthDate = formatDayInPast(daysToLastMonth)
  const lastMonth = getQueryString(lastMonthDate, todaysDate, tab)

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

        const dateProps = getDateProps(request.query.tab)
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
    const { startDate, endDate, tab } = request.query

    const [from, to] = getFromAndTo(startDate, endDate)
    const intervals = getIntervals(startDate, endDate)
    const payload = await getReports(request, from, to, intervals)

    const labels = intervals.map((interval) => format(interval, 'dd MMM HH:mm'))
    const reports = mapReports(payload, labels)

    const fromPeriod = formatReportingDate(startDate)
    const toPeriod = formatReportingDate(endDate)
    const timePeriod = `${fromPeriod} to ${toPeriod}`

    const csvQuery = getQueryString(
      format(startDate, dateFormat),
      format(endDate, dateFormat)
    )
    const dateProps = getDateProps(tab)

    return h.view('reporting', {
      reports,
      labels,
      ...dateProps,
      csvQuery,
      timePeriod,
      startDate: format(startDate, dateFormat),
      endDate: format(endDate, dateFormat),
      tab
    })
  }
}
