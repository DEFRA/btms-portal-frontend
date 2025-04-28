import {
  getCustomsDeclarationByMovementRefNum,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationByChedRef,
  getPreNotificationByPartialChedRef,
  getPreNotificationsByChedRefs

} from './btms-api-client.js'
import { CDS_CHED_REF_PREFIX, searchPatterns, searchTypes } from './search-constants.js'

const isValidSearchTerm = (input) => {
  if (input?.length) {
    return Object.keys(searchPatterns).some((searchPatternsKey) => {
      return searchPatterns[searchPatternsKey].test(input.toUpperCase())
    })
  }
  return false
}

const hasSearchResult = async (searchTerm) => {
  const searchResult = await performSearch(searchTerm) // TODO: cache search results in performSearch()
  return searchResult.customsDeclarations.length || searchResult.preNotifications.length
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
  }
  if (searchType === searchTypes.PRE_NOTIFICATION_PARTIAL_REF) {
    rawPreNotification = await getPreNotificationByPartialChedRef(searchTerm)
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
  if (searchPatterns.MOVEMENT_REF.test(searchTerm.toUpperCase())) {
    return searchCustomsDeclarations(searchTerm)
  }
  if (searchPatterns.CHED_REF.test(searchTerm.toUpperCase())) {
    return searchPreNotifications(searchTerm, searchTypes.PRE_NOTIFICATION)
  }
  if (searchPatterns.CDS_CHED_REF.test(searchTerm.toUpperCase())) {
    const chedPartialRef = searchTerm.substring(CDS_CHED_REF_PREFIX.length)
    return searchPreNotifications(chedPartialRef, searchTypes.PRE_NOTIFICATION_PARTIAL_REF, searchTerm)
  }
  if (
    searchPatterns.PARTIAL_CHED_REF.test(searchTerm.toUpperCase()) ||
    searchPatterns.NUMERIC_ONLY_CHED_REF.test(searchTerm.toUpperCase())
  ) {
    return searchPreNotifications(searchTerm, searchTypes.PRE_NOTIFICATION_PARTIAL_REF)
  }
  if (searchPatterns.DUCR_REF.test(searchTerm.toUpperCase())) {
    // TODO: this will never return a result, implement against new search endpoint
    return searchCustomsDeclarations(searchTerm)
  }

  return createSearchResult(searchTerm, null, ['banan'], [])
}

export {
  isValidSearchTerm,
  hasSearchResult,
  performSearch
}
