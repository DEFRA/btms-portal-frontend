import { format } from 'date-fns'
import {
  decisionCodeDescriptions,
  checkCodeToAuthorityMapping,
  CHED_REF_NUMERIC_IDENTIFIER_INDEX, DATE_FORMAT
} from './model-constants.js'

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
  let decisionHighLevelDesc
  if (isReleaseDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Release'
  } else if (isRefusalDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Refusal'
  } else if (isErrorDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Data error'
  } else if (isHoldDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Hold'
  } else {
    decisionHighLevelDesc = null
  }
  if (decisionDetail?.length && decisionHighLevelDesc?.length) {
    return `${decisionHighLevelDesc} - ${decisionDetail}`
  }
  if (decisionHighLevelDesc?.length) {
    return decisionHighLevelDesc
  }
  if (decisionDetail?.length) {
    return decisionDetail
  }
  return 'Unknown'
}

const getAuthorityByCheckCode = (checkCode) => {
  return (checkCode?.length) ? checkCodeToAuthorityMapping[checkCode.toUpperCase()] : ''
}

const getCustomsDeclarationStatus = (commodities) => {
  if (commodities?.length) {
    if (commodities.some(c => c.checks.some(chk => isErrorDecisionCode(chk.decisionCode)))) {
      return 'Data error'
    }
    if (commodities.some(c => c.checks.some(chk => isRefusalDecisionCode(chk.decisionCode)))) {
      return 'Refusal'
    }
    if (commodities.some(c => c.checks.some(chk => isNoMatchDecisionCode(chk.decisionCode)))) {
      return 'No match'
    }
    if (commodities.some(c => c.checks.some(chk => isHoldDecisionCode(chk.decisionCode)))) {
      return 'Hold'
    }
    if (commodities.every(c => c.checks.every(chk => isReleaseDecisionCode(chk.decisionCode)))) {
      return 'Released'
    }
  }
  return 'Unknown'
}

const getMatchStatus = (commodity, customsDeclaration) => {
  // example pre-notification reference: CHEDD.GB.2024.1234567
  const relatedPreNotifications = customsDeclaration.notifications?.data?.length
    ? customsDeclaration.notifications.data.map(n => n.id.split('.')[CHED_REF_NUMERIC_IDENTIFIER_INDEX])
    : []
  const allDocReferences = commodity.documents
    .filter(d => d.documentReference)
    .map(d => d.documentReference)
  if (!relatedPreNotifications.length) {
    return { isMatched: false, unmatchedDocRefs: allDocReferences }
  }
  // example document reference: GBCHD2024.1234567
  const docRefNumericIdentifierIndex = 1
  const unmatchedDocRefs = allDocReferences.filter(docRef =>
    !relatedPreNotifications.includes(docRef.split('.')[docRefNumericIdentifierIndex]))
  return { isMatched: !unmatchedDocRefs.length, unmatchedDocRefs }
}
export const createCustomsDeclarationModel = (sourceCustomsDeclaration) => {
  return {
    movementReferenceNumber: sourceCustomsDeclaration.entryReference,
    customsDeclarationStatus: getCustomsDeclarationStatus(sourceCustomsDeclaration.items),
    lastUpdated: format(new Date(sourceCustomsDeclaration.updatedSource), DATE_FORMAT),
    commodities: sourceCustomsDeclaration.items?.length
      ? sourceCustomsDeclaration.items.map(i => {
        return {
          itemNumber: i.itemNumber,
          commodityCode: i.taricCommodityCode,
          commodityDesc: i.goodsDescription,
          weightOrQuantity: i.itemNetMass && i.itemNetMass !== '0' ? i.itemNetMass : (i.itemSupplementaryUnits ?? ''),
          matchStatus: getMatchStatus(i, sourceCustomsDeclaration),
          documents: [...new Set(i.documents.map(d => d.documentReference))],
          decisions: i.checks.map(c => `${getDecisionDescription(c.decisionCode)} (${getAuthorityByCheckCode(c.checkCode)})`)
        }
      })
      : []
  }
}
