import { createCustomsDeclarationModel } from './customs-declaration-model.js'
import { createPreNotificationModel } from './pre-notification-model.js'

const getRelatedDocumentCodes = (customsDeclarations, chedReferenceNum) => {
  const numericChedRef = chedReferenceNum.split('.')[3]
  return (customsDeclarations?.length)
    ? customsDeclarations.flatMap(cd => {
      const docCodes = cd.items?.flatMap(i => i.documents)
        .filter(d => d.documentReference.endsWith(numericChedRef))
        .map(d => d.documentCode)
      return [...new Set(docCodes)]
    })
    : []
}
export const createSearchResultsModel = (searchResult) => {
  return {
    searchTerm: searchResult.searchTerm,
    searchType: searchResult.searchType,
    customsDeclarations: searchResult.customsDeclarations.map(cd => createCustomsDeclarationModel(cd)),
    preNotifications: searchResult.preNotifications.map(pn => {
      const relatedDocumentCodes = getRelatedDocumentCodes(searchResult.customsDeclarations, pn.id)
      return createPreNotificationModel(pn, relatedDocumentCodes)
    })
  }
}
