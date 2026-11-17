import { sortDescending } from './sort.js'
import { DATE_FORMAT } from './model-constants.js'
import { format } from 'date-fns'

const FIS_NOTIFICATION_STATUSES = {
  IUUOK: { label: 'Valid', className: 'govuk-tag--green' },
  IUUNA: { label: 'Valid', className: 'govuk-tag--green' },
  IUUNotCompliant: { label: 'Rejected', className: 'govuk-tag--red' }
}

const inProgressStatus = { label: 'In Progress', className: 'govuk-tag--yellow' }

export const fisNotificationStatus = (iuuOption) =>
  FIS_NOTIFICATION_STATUSES[iuuOption] ?? inProgressStatus

const mapFisNotification = (iuuNotification) => {
  const status = fisNotificationStatus(iuuNotification?.iuuOption)

  return {
    reference: iuuNotification?.reference,
    statusLabel: status.label,
    statusClass: status.className,
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
