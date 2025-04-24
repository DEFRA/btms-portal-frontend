import { format } from 'date-fns'
import {
  decisionCodeDescriptions,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  IUUDocumentReferences,
  CHED_REF_NUMERIC_IDENTIFIER_INDEX,
  DATE_FORMAT
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

const getCustomsDeclarationStatus = (items, finalisation) => {
  if (finalisation?.manualAction === true) {
    return 'Manually released'
  }

  if (finalisation?.manualAction === false) {
    return finalStateMappings[finalisation.finalState]
  }

  if (items?.length) {
    if (items.some(c => c.checks.some(chk => isErrorDecisionCode(chk.decisionCode)))) {
      return 'Data error'
    }
    if (items.some(c => c.checks.some(chk => isRefusalDecisionCode(chk.decisionCode)))) {
      return 'Refusal'
    }
    if (items.some(c => c.checks.some(chk => isNoMatchDecisionCode(chk.decisionCode)))) {
      return 'No match'
    }
    if (items.some(c => c.checks.some(chk => isHoldDecisionCode(chk.decisionCode)))) {
      return 'Hold'
    }
    if (items.every(c => c.checks.every(chk => isReleaseDecisionCode(chk.decisionCode)))) {
      return 'Released'
    }
  }
  return 'Unknown'
}

const getMatchStatus = (documentReferences, notifications) => {
  // example pre-notification reference: CHEDD.GB.2024.1234567
  const relatedPreNotifications = notifications
    .data.map(n => n.id.split('.')[CHED_REF_NUMERIC_IDENTIFIER_INDEX])

  if (!relatedPreNotifications.length) {
    return { isMatched: false, unmatchedDocRefs: documentReferences }
  }
  // example document reference: GBCHD2024.1234567 or GB.2024.1234567
  const refMatchLength = 7
  const unmatchedDocRefs = documentReferences.filter(docRef =>
    !relatedPreNotifications.includes(docRef.slice(-refMatchLength)))

  return { isMatched: !unmatchedDocRefs.length, unmatchedDocRefs }
}
export const createCustomsDeclarationModel = ({
  entryReference,
  items,
  updatedSource,
  notifications,
  finalisation
}) => {
  const customsDeclarationStatus = getCustomsDeclarationStatus(items, finalisation)
  const open = customsDeclarationStatus !== 'Cancelled'

  return {
    movementReferenceNumber: entryReference,
    customsDeclarationStatus,
    lastUpdated: format(new Date(updatedSource), DATE_FORMAT),
    open,
    commodities: items?.length
      ? items.map(i => {
        const documentReferences = [
          ...new Set(i.documents
            .filter(({ documentCode }) => !IUUDocumentReferences.includes(documentCode))
            .map(({ documentReference }) => documentReference)
          )
        ]

        return {
          itemNumber: i.itemNumber,
          commodityCode: i.taricCommodityCode,
          commodityDesc: i.goodsDescription,
          weightOrQuantity: i.itemNetMass && i.itemNetMass !== '0' ? i.itemNetMass : (i.itemSupplementaryUnits ?? ''),
          matchStatus: getMatchStatus(documentReferences, notifications),
          documents: documentReferences,
          decisions: i.checks.map(c => `${getDecisionDescription(c.decisionCode)} (${getAuthorityByCheckCode(c.checkCode)})`)
        }
      })
      : []
  }
}
