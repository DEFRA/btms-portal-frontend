import { format } from 'date-fns'
import { decisionCodeDescriptions, checkCodeToAuthorityMapping } from './constants.js'

const hasDesiredPrefix = (decisionCode, desiredPrefix) => {
  return decisionCode?.length && decisionCode.toLowerCase().startsWith(desiredPrefix)
}
const isNoMatchDecisionCode = (decisionCode) => {
  return decisionCode?.length && decisionCode.toLowerCase() === 'x00'
}
const isErrorDecisionCode = (decisionCode) => {
  return hasDesiredPrefix(decisionCode, 'e0')
}
const isHoldDecisionCode = (decisionCode) => {
  return hasDesiredPrefix(decisionCode, 'h0')
}
const isRefusalDecisionCode = (decisionCode) => {
  return hasDesiredPrefix(decisionCode, 'n0')
}
const isReleaseDecisionCode = (decisionCode) => {
  return hasDesiredPrefix(decisionCode, 'c0')
}

const getDecisionDescription = (decisionCode) => {
  const decisionDetail = decisionCode?.length ? decisionCodeDescriptions[decisionCode] : ''
  let decisionHighLevelDesc = null
  if (isReleaseDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Release'
  } else if (isRefusalDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Refusal'
  } else if (isErrorDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Data error'
  } else if (isHoldDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Hold'
  } else if (isNoMatchDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'No match'
  }
  return decisionDetail?.length && decisionHighLevelDesc?.length
    ? `${decisionHighLevelDesc} - ${decisionDetail}`
    : 'Unknown'
}

const getAuthorityByCheckCode = (checkCode) => {
  return (checkCode?.length) ? checkCodeToAuthorityMapping[checkCode.toUpperCase()] : ''
}

const getCustomsDeclarationStatus = (commodities) => {
  if (commodities?.length) {
    if (commodities.some(c => c.checks.some(chk => isErrorDecisionCode(chk.decisionCode)))) {
      return 'Data error'
    } else if (commodities.some(c => c.checks.some(chk => isRefusalDecisionCode(chk.decisionCode)))) {
      return 'Refusal'
    } else if (commodities.some(c => c.checks.some(chk => isNoMatchDecisionCode(chk.decisionCode)))) {
      return 'No match'
    } else if (commodities.some(c => c.checks.some(chk => isHoldDecisionCode(chk.decisionCode)))) {
      return 'Hold'
    } else if (commodities.every(c => c.checks.every(chk => isReleaseDecisionCode(chk.decisionCode)))) {
      return 'Released'
    }
  }
  return 'Unknown'
}

const getMatchStatus = (commodity, customsDeclaration) => {
  const relatedPreNotifications = customsDeclaration.notifications?.data?.length
    ? customsDeclaration.notifications.data.map(n => n.id.split('.')[3])
    : []
  const allDocReferences = commodity.documents
    .filter(d => d.documentReference)
    .map(d => d.documentReference)
  if (!relatedPreNotifications.length) {
    return { isMatched: false, unmatchedDocRefs: allDocReferences }
  }
  const unmatchedDocRefs = allDocReferences.filter(docRef => !relatedPreNotifications.includes(docRef.split('.')[1]))
  return { isMatched: !unmatchedDocRefs.length, unmatchedDocRefs }
}
export const createCustomsDeclarationModel = (sourceCustomsDeclaration) => {
  return {
    movementReferenceNumber: sourceCustomsDeclaration.entryReference,
    customsDeclarationStatus: getCustomsDeclarationStatus(sourceCustomsDeclaration.items),
    lastUpdated: format(new Date(sourceCustomsDeclaration.updatedSource), 'd MMMM yyyy, hh:mm'),
    commodities: sourceCustomsDeclaration.items?.length
      ? sourceCustomsDeclaration.items.map(i => {
        return {
          itemNumber: i.itemNumber,
          commodityCode: i.taricCommodityCode,
          commodityDesc: i.goodsDescription,
          weightOrQuantity: i.itemSupplementaryUnits ? i.itemSupplementaryUnits : (i.itemNetMass ?? ''),
          matchStatus: getMatchStatus(i, sourceCustomsDeclaration),
          documents: i.documents.map(d => d.documentReference),
          decisions: i.checks.map(c => `${getDecisionDescription(c.decisionCode)} (${getAuthorityByCheckCode(c.checkCode)})`)
        }
      })
      : [],
    relatedPreNotifications: sourceCustomsDeclaration.relatedPreNotifications
  }
}
