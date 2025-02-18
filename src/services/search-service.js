import {
  getCustomsDeclarationByMovementRefNum,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationByChedRef,
  getPreNotificationByPartialChedRef,
  getPreNotificationsByChedRefs

} from './btms-api-client.js'
import { CDS_CHED_REF_PREFIX, searchPatterns, searchTypes } from './search-constants.js'

const isMovementReferenceNumber = (input) => {
  return input?.length && searchPatterns.MOVEMENT_REF.test(input.toUpperCase())
}
const isChedReference = (input) => {
  return input?.length && searchPatterns.CHED_REF.test(input.toUpperCase())
}
const isCdsChedReference = (input) => {
  return input?.length && searchPatterns.CDS_CHED_REF.test(input.toUpperCase())
}
const isPartialChedReference = (input) => {
  return (input?.length && searchPatterns.PARTIAL_CHED_REF.test(input.toUpperCase())) ||
    (input?.length && searchPatterns.NUMERIC_ONLY_CHED_REF.test(input.toUpperCase()))
}

const isValidSearchTerm = (input) => {
  if (input?.length) {
    return Object.keys(searchPatterns).some((searchPatternsKey) => {
      return searchPatterns[searchPatternsKey].test(input.toUpperCase())
    })
  }
  return false
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
  const preNotifications = createArray(rawPreNotificationSearchResult?.data)
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
  let rawPreNotification
  if (searchType === searchTypes.PRE_NOTIFICATION) {
    rawPreNotification = await getPreNotificationByChedRef(searchTerm)
  } else if (searchType === searchTypes.PRE_NOTIFICATION_PARTIAL_REF) {
    rawPreNotification = await getPreNotificationByPartialChedRef(searchTerm)
  } else {
    throw new Error(`Unexpected searchType encountered: ${searchType}`)
  }
  const relatedCustomsDeclarations = await getRelatedCustomsDeclarations(rawPreNotification)
  return createSearchResult(
    searchTermToDisplay?.length ? searchTermToDisplay : searchTerm,
    searchType,
    relatedCustomsDeclarations,
    rawPreNotification)
}

const searchCustomsDeclarations = async (searchTerm) => {
  const rawCustomsDeclaration = await getCustomsDeclarationByMovementRefNum(searchTerm)
  const relatedPreNotifications = await getRelatedPreNotifications(rawCustomsDeclaration)
  return createSearchResult(
    searchTerm,
    searchTypes.CUSTOMS_DECLARATION,
    rawCustomsDeclaration,
    relatedPreNotifications)
}

const performSearch = async (searchTerm) => {
  if (isMovementReferenceNumber(searchTerm)) {
    return searchCustomsDeclarations(searchTerm)
  }
  if (isChedReference(searchTerm)) {
    return searchPreNotifications(searchTerm, searchTypes.PRE_NOTIFICATION)
  }
  if (isCdsChedReference(searchTerm)) {
    const chedPartialRef = searchTerm.substring(CDS_CHED_REF_PREFIX.length)
    return searchPreNotifications(chedPartialRef, searchTypes.PRE_NOTIFICATION_PARTIAL_REF, searchTerm)
  }
  if (isPartialChedReference(searchTerm)) {
    return searchPreNotifications(searchTerm, searchTypes.PRE_NOTIFICATION_PARTIAL_REF)
  }
  return createSearchResult(searchTerm, null, [], [])
}

export {
  isValidSearchTerm,
  performSearch
}
