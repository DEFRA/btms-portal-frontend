import originalJoi from 'joi'
import joiDate from '@joi/date'
import {
  startOfDay,
  endOfDay,
  endOfYesterday,
  startOfYesterday,
  isToday
} from 'date-fns'

const joi = originalJoi.extend(joiDate)

const dateFormat = ['D/M/YYYY', 'DD/M/YYYY', 'DD/MM/YYYY']

export const dateRange = joi.object({
  startDate: joi
    .date()
    .format(dateFormat)
    .default(startOfYesterday)
    .custom(startOfDay)
    .messages({
      'date.format': 'Enter a valid start date'
    }),
  endDate: joi
    .date()
    .format(dateFormat)
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
