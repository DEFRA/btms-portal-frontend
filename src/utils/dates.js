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
const oneMinute = 60000
const twoMinutes = 120000
const fiveMinutes = 300000
const tenMinutes = 600000
const twentyMinutes = 1200000
const thirtyMinutes = 1800000
const oneHour = 3600000
const twoHours = 7200000
const threeHours = 10800000
const fourHours = 14400000
const fiveHours = 18000000
const sixHours = 21600000
const sevenHours = 25200000
const eightHours = 28800000
const nineHours = 32400000
const tenHours = 36000000
const elevenHours = 39600000
const twelveHours = 43200000
const oneDay = 86400000
const twoDays = 172800000
const fourDays = 345600000

const humanFriendlyIntervalDurations = [
  oneMinute,
  twoMinutes,
  fiveMinutes,
  tenMinutes,
  twentyMinutes,
  thirtyMinutes,
  oneHour,
  twoHours,
  threeHours,
  fourHours,
  fiveHours,
  sixHours,
  sevenHours,
  eightHours,
  nineHours,
  tenHours,
  elevenHours,
  twelveHours,
  oneDay,
  twoDays,
  fourDays
]

export const getIntervals = (startDate, endDate) => {
  const intervals = []

  const diffInMS = Math.floor(endDate - startDate)
  const exactIntervalDuration = Math.floor(diffInMS / idealIntervalCount)
  const intervalDuration =
    humanFriendlyIntervalDurations.find(
      (duration) => duration >= exactIntervalDuration
    ) || humanFriendlyIntervalDurations.at(-1)

  for (let index = 1; index < idealIntervalCount; index += 1) {
    const interval = new Date(startDate.getTime() + index * intervalDuration)

    if (interval.getTime() <= endDate.getTime() + 1) {
      intervals.push(interval.toISOString())
    }
  }

  return intervals
}
