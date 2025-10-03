import {
  addMilliseconds,
  format,
  startOfToday,
  startOfYesterday,
  subDays
} from 'date-fns'

export const dateFormat = 'dd/MM/yyyy'

export const formatToday = () => format(startOfToday(), dateFormat)

export const formatYesterday = () => format(startOfYesterday(), dateFormat)

export const formatDayInPast = (days) =>
  format(subDays(new Date(), days), dateFormat)

export const formatReportingDate = (date) =>
  format(date, "d MMMM yyyy 'at' HH:mm")

export const getFromAndTo = (startDate, endDate) => {
  const oneMillisecond = 1

  return [
    startDate.toISOString(),
    addMilliseconds(endDate, oneMillisecond).toISOString()
  ]
}

const idealIntervalCount = 30

const humanFriendlyIntervalDurations = [
  60000, 120000, 300000, 600000, 1200000, 1800000, 3600000, 7200000, 10800000,
  14400000, 18000000, 21600000, 25200000, 28800000, 32400000, 36000000,
  39600000, 43200000, 86400000, 172800000, 345600000
]

export const getIntervals = (startDate, endDate) => {
  const intervals = []

  const diffInMS = Math.floor(endDate - startDate)
  const exactIntervalDuration = Math.floor(diffInMS / idealIntervalCount)
  const intervalDuration = humanFriendlyIntervalDurations.find(
    (duration) => duration >= exactIntervalDuration
  )

  for (let index = 1; index < idealIntervalCount; index += 1) {
    const interval = new Date(startDate.getTime() + index * intervalDuration)

    if (interval.getTime() <= endDate.getTime() + 1) {
      intervals.push(interval.toISOString())
    }
  }

  return intervals
}
