import originalJoi from 'joi'
import joiDate from '@joi/date'
import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { getSummary } from '../services/reporting.js'
import { mapReports } from '../models/reports.js'
import {
  format,
  startOfDay,
  endOfDay,
  endOfYesterday,
  startOfYesterday,
  isToday
} from 'date-fns'
import {
  formatDayInPast,
  formatToday,
  formatYesterday,
  formatReportingDate
} from '../utils/dates.js'

const joi = originalJoi.extend(joiDate)

const getQueryString = (startDate, endDate) =>
  new URLSearchParams({
    startDate,
    endDate
  }).toString()

const joiDateFormat = ['D/M/YYYY', 'DD/M/YYYY', 'DD/MM/YYYY']
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
      query: joi
        .object({
          startDate: joi
            .date()
            .format(joiDateFormat)
            .default(startOfYesterday)
            .custom(startOfDay)
            .messages({
              'date.format': 'Enter a valid start date'
            }),
          endDate: joi
            .date()
            .format(joiDateFormat)
            .default(endOfYesterday)
            .custom((value) => (isToday(value) ? new Date() : endOfDay(value)))
            .min(joi.ref('startDate'))
            .max('now')
            .messages({
              'date.format': 'Enter a valid end date',
              'date.min': 'End date must be after or the same as start date',
              'date.max': 'End date must be today or in the past'
            })
        })
        .unknown(),
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

    const dateProps = getDateProps()

    return h.view('reporting', {
      reports,
      ...dateProps,
      timePeriod,
      startDate: format(startDate, dateFormat),
      endDate: format(endDate, dateFormat)
    })
  }
}
