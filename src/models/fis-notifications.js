import { sortDescending } from './sort.js'
import { DATE_FORMAT } from './model-constants.js'
import { format } from 'date-fns'

const mapFisNotification = (iuuNotification) => {
  return {
    reference: iuuNotification?.reference,
    status: iuuNotification.iuuOption,
    updated: iuuNotification?.lastUpdated ? format(iuuNotification?.lastUpdated, DATE_FORMAT) : null
  }
}

const isSearchTermMatch = (searchTerm, fisNotification) =>
  fisNotification.reference?.toUpperCase() === searchTerm

export const mapFisNotifications = ({ iuus }, searchTerm) => {
  return iuus.map((fisNotification) =>
    mapFisNotification(fisNotification?.iuuNotification)
  ).sort(sortDescending(searchTerm, isSearchTermMatch))
}
