import { format } from 'date-fns'
import {
  chedStatusDescriptions,
  chedDecisionDescriptions,
  documentCodeToAuthorityMapping
} from './constants.js'

const getAuthorities = (documentCodes) => {
  if (documentCodes?.length) {
    return documentCodes
      .map(docCode => documentCodeToAuthorityMapping[docCode])
      .filter(docCode => docCode?.length)
  }
  return []
}
const getDecision = (preNotification) => {
  const relevantStatuses = ['Validated', 'Rejected']
  if (relevantStatuses.includes(preNotification?.status) &&
    preNotification.partTwo?.decision?.decisionEnum) {
    const decisionDescription = chedDecisionDescriptions[preNotification.partTwo.decision.decisionEnum]
    if (decisionDescription?.length) {
      return decisionDescription
    }
  }
  return 'Decision not given'
}

const getCommodityDescription = (commodity) => {
  if (commodity?.speciesName?.length) {
    return commodity.speciesName
  } else if (commodity?.commodityDescription?.length) {
    return commodity.commodityDescription
  } else if (commodity?.complementName?.length) {
    return commodity.complementName
  }
  return ''
}

const getStatus = (chedStatus) => {
  if (chedStatus?.length) {
    return chedStatusDescriptions[chedStatus]
  }
  return 'Unknown'
}

const getWeightOrQuantity = (commodity) => {
  return commodity.additionalData?.netWeight
}
export const createPreNotificationModel = (sourcePreNotification, relatedDocumentCodes) => {
  return {
    authorities: getAuthorities(relatedDocumentCodes),
    chedRef: sourcePreNotification.id,
    commodities: sourcePreNotification.commodities.map((c) => {
      return {
        itemNumber: c.complementId,
        commodityCode: c.commodityId,
        commodityDesc: getCommodityDescription(c),
        weightOrQuantity: getWeightOrQuantity(c),
        decision: getDecision(sourcePreNotification)
      }
    }),
    decision: getDecision(sourcePreNotification),
    lastUpdated: format(new Date(sourcePreNotification.updatedSource), 'd MMMM yyyy, hh:mm'),
    status: getStatus(sourcePreNotification.status)
  }
}
