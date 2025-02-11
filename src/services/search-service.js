import {
  getPreNotificationByChedRef,
  getCustomsDeclarationByMovementRefNum,
  getPreNotificationsByChedRefs,
  getCustomsDeclarationsByMovementRefNums
} from './btms-api-client.js'
import { searchPatterns, searchTypes } from './search-constants.js'

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
  const customsDeclarations = createArray(rawCustomsDeclarations?.data)
  const preNotifications = createArray(rawPreNotifications?.data)
  return { searchTerm, searchType, customsDeclarations, preNotifications }
}

const getRelatedPreNotifications = async (customsDeclaration) => {
  if (customsDeclaration?.data?.notifications?.data?.length) {
    const relatedChedReferences = customsDeclaration.data.notifications.data
      .map(r => r.id)
    return getPreNotificationsByChedRefs(relatedChedReferences)
  }
  return []
}

const getRelatedCustomsDeclarations = async (rawPreNotificationSearchResult) => {
  const preNotifications = createArray(rawPreNotificationSearchResult.data)
  if (preNotifications.length) {
    const relatedCustomsDeclarationMrns = preNotifications
      .filter(pn => pn.movements?.data?.length)
      .flatMap(pn => pn.movements.data.map(m => m.id))
    if (relatedCustomsDeclarationMrns.length) {
      return getCustomsDeclarationsByMovementRefNums(relatedCustomsDeclarationMrns)
    }
  }
  return []
}

const searchPreNotifications = async (searchTerm, searchType, searchTermToDisplay) => {
  const rawPreNotification = await getPreNotificationByChedRef(searchTerm)
  const relatedCustomsDeclarations = await getRelatedCustomsDeclarations(rawPreNotification)
  return createSearchResult(
    searchTermToDisplay?.length ? searchTermToDisplay : searchTerm,
    searchType,
    relatedCustomsDeclarations,
    rawPreNotification)
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
  }
  if (isChedReference(searchTerm)) {
    return searchPreNotifications(searchTerm, searchTypes.PRE_NOTIFICATION)
  }
  return createSearchResult(searchTerm, null, [], [])
}

export {
  performSearch
}
