import {
  getPreNotificationByChedRef,
  getCustomsDeclarationByMovementRefNum,
  getPreNotificationsByChedRefs,
  getCustomsDeclarationsByMovementRefNums
} from './btms-api-client.js'

const searchPatterns = {
  CHED_REF: /^CHED([ADP]|P{2})\.GB\.2\d{3}\.\d{6,}$/,
  MOVEMENT_REF: /^\d{2}[A-Z]{2}[A-z0-9]{14}$/
}

const searchTypes = {
  CUSTOMS_DECLARATION: 'customs-declaration',
  PRE_NOTIFICATION: 'pre-notification'
}
const isMovementReferenceNumber = (input) => {
  return input?.length && searchPatterns.MOVEMENT_REF.test(input.toUpperCase())
}
const isChedReference = (input) => {
  return input?.length && searchPatterns.CHED_REF.test(input.toUpperCase())
}

const createArray = (data) => {
  if (!data) {
    return []
  }
  return Array.isArray(data) ? data : [data]
}

const createSearchResult = (searchTerm, searchType, rawCustomsDeclarations, rawPreNotifications) => {
  const customsDeclarations = createArray(rawCustomsDeclarations.data)
  const preNotifications = createArray(rawPreNotifications.data)
  return { searchTerm, searchType, customsDeclarations, preNotifications }
}

const getRelatedPreNotifications = async (customsDeclaration) => {
  if (customsDeclaration.data?.notifications?.data?.length) {
    const relatedChedReferences = customsDeclaration.data.notifications.data
      .map(r => r.id)
    return getPreNotificationsByChedRefs(relatedChedReferences)
  }
  return []
}

const getRelatedCustomsDeclarations = async (preNotification) => {
  if (preNotification.data?.movements?.data?.length) {
    const relatedCustomsDeclarationMrns = preNotification.data.movements.data
      .map(m => m.id)
    return getCustomsDeclarationsByMovementRefNums(relatedCustomsDeclarationMrns)
  }
  return []
}

const performSearch = async (searchTerm) => {
  if (isMovementReferenceNumber(searchTerm)) {
    const rawCustomsDeclaration = await getCustomsDeclarationByMovementRefNum(searchTerm)
    const relatedPreNotifications = await getRelatedPreNotifications(rawCustomsDeclaration)
    return createSearchResult(
      searchTerm,
      searchTypes.CUSTOMS_DECLARATION,
      rawCustomsDeclaration,
      relatedPreNotifications)
  } else if (isChedReference(searchTerm)) {
    const rawPreNotification = await getPreNotificationByChedRef(searchTerm)
    const relatedCustomsDeclarations = await getRelatedCustomsDeclarations(rawPreNotification)
    return createSearchResult(
      searchTerm,
      searchTypes.PRE_NOTIFICATION,
      relatedCustomsDeclarations,
      rawPreNotification)
  } else {
    throw new Error(`Unexpected searchTerm encountered: ${searchTerm}`)
  }
}

export {
  performSearch
}
