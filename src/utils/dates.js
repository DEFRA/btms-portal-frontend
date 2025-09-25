import { format, startOfToday, startOfYesterday, subDays } from 'date-fns'

export const dateFormat = 'dd/MM/yyyy'

export const formatToday = () => format(startOfToday(), dateFormat)

export const formatYesterday = () => format(startOfYesterday(), dateFormat)

export const formatDayInPast = (days) =>
  format(subDays(new Date(), days), dateFormat)

export const formatReportingDate = (date) =>
  format(date, "d MMMM yyyy 'at' HH:mm")
