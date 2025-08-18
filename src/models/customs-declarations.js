import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  noMatchInternalDecisionCodes,
  IUUDocumentCodes,
  DATE_FORMAT
} from './model-constants.js'

const documentReferenceRegex = /\d{7}[VR]?$/

const extractDocumentReferenceId = (documentReference) => {
  const match = documentReference.match(documentReferenceRegex)
  if (match === null) {
    return null
  }

  return match.length === 1 ? match[0] : null
}

const determineWeightOrQuantity = (commodity, decisions) => {
  const showQuantity = decisions.some(decision => {
    const relevantDocCodes = checkCodeToDocumentCodeMapping[decision.checkCode] || []
    return relevantDocCodes.includes('C640')
  })

  const primary = showQuantity ? commodity.supplementaryUnits : commodity.netMass
  const fallbackValue = showQuantity ? commodity.netMass : commodity.supplementaryUnits

  if (primary == null || primary === 0 || primary === '0') {
    return Number(fallbackValue)
  }

  return Number(primary)
}

const hasDesiredPrefix = (decisionCode, desiredPrefix) => {
  return decisionCode?.length && decisionCode.toLowerCase().startsWith(desiredPrefix)
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

export const getDecision = (decisionCode) => {
  let decisionHighLevelDesc
  if (isReleaseDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Release'
  } else if (isRefusalDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Refuse'
  } else if (isErrorDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Data error'
  } else if (isHoldDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Hold'
  } else {
    decisionHighLevelDesc = ''
  }

  return decisionHighLevelDesc
}

export const getDecisionDescription = (decisionCode, notificationStatus, isIuuOutcome, allDecisionCodesAreNoMatch, iuuRelatedChedpCheck) => {
  if (closedChedStatuses.includes(notificationStatus)) {
    return `CHED ${notificationStatus.toLowerCase()}`
  }

  if (isIuuOutcome && decisionCode === 'X00') {
    if (allDecisionCodesAreNoMatch) {
      return 'No match'
    }

    if (iuuRelatedChedpCheck?.decisionCode === 'H01') {
      return 'Hold - Decision not given'
    }

    if (iuuRelatedChedpCheck?.decisionCode === 'H02') {
      return 'Hold - To be inspected'
    }

    if (isReleaseDecisionCode(iuuRelatedChedpCheck?.decisionCode) ||
      isRefusalDecisionCode(iuuRelatedChedpCheck?.decisionCode)) {
      return 'Refuse - IUU not compliant'
    }
  }

  return decisionCodeDescriptions[decisionCode]
}

export const getCustomsDeclarationStatus = (finalisation) => {
  if (finalisation === null) {
    return 'In-Progress'
  }

  if (finalisation.isManualRelease === true) {
    return 'Finalised - Manually released'
  }

  return `Finalised - ${finalStateMappings[finalisation.finalState]}`
}

export const getCustomsDeclarationOpenState = (finalisation) => !(
  finalisation !== null &&
  finalisation.isManualRelease === false &&
  (finalisation.finalState === '1' || finalisation.finalState === '2')
)

const createLegacyDecision = (commodity, check, document, decisionCheck) => ({
  itemNumber: commodity.itemNumber,
  documentReference: document?.documentReference || null,
  checkCode: check.checkCode,
  decisionCode: decisionCheck?.decisionCode,
  decisionReason: decisionCheck?.decisionReasons?.[0] ?? null,
  internalDecisionCode: decisionCheck?.decisionInternalFurtherDetail?.[0] ?? null
})

const mapLegacyDecisions = (commodity, clearanceDecision) => {
  return commodity.checks.map(check => {
    const associatedDocumentCodes = checkCodeToDocumentCodeMapping[check.checkCode]
    const associatedDocuments = (commodity.documents || []).filter(doc => associatedDocumentCodes.includes(doc.documentCode))

    // This handles H220 - requires CHED cases where there are no docs, it creates a doc level decision with no doc ref
    if (associatedDocuments.length === 0) {
      const clearanceDecisionCheck = clearanceDecision?.checks.find(({ checkCode }) => checkCode === check.checkCode)
      return [createLegacyDecision(commodity, check, null, clearanceDecisionCheck)]
    }

    return associatedDocuments.map(doc => {
      const decision = clearanceDecision?.checks.find(({ checkCode }) => checkCode === check.checkCode)

      return createLegacyDecision(commodity, check, doc, decision)
    })
  }).flat()
}

const mapCommodity = (commodity, notificationStatuses, clearanceDecision) => {
  const documentLevelDecisions = clearanceDecision?.results && clearanceDecision.results.length > 0 ? clearanceDecision.results.filter(({ itemNumber }) => itemNumber === commodity.itemNumber) : null
  // TODO: Remove - Workaround until the DD outputs the checkCode as H220
  const areAnyRequiresChedDecisions = documentLevelDecisions?.some(({ checkCode, decisionCode }) => decisionCode === 'X00' && checkCode === null) && (commodity.documents || []).length === 0
  const decisions = (!areAnyRequiresChedDecisions && documentLevelDecisions) || mapLegacyDecisions(commodity, (clearanceDecision?.items || []).find(({ itemNumber }) => itemNumber === commodity.itemNumber))

  const allDecisionCodesAreNoMatch = decisions.every(decision => decision.decisionCode === 'X00')
  const iuuRelatedChedpCheck = decisions.find(decision => decision.checkCode === 'H222')

  const clearanceDecisions = decisions.filter(result => result.itemNumber === commodity.itemNumber)
    .map(decision => {
      const documentReferenceId = decision.documentReference ? extractDocumentReferenceId(decision.documentReference) : null
      const notificationStatus = documentReferenceId ? notificationStatuses[documentReferenceId] : null
      const relevantDocCodes = checkCodeToDocumentCodeMapping[decision.checkCode]
      const isIuuOutcome = relevantDocCodes.some(code => IUUDocumentCodes.includes(code))
      // TODO: Remove when DD outputs decisionCode
      // H220 / requires CHED currently returns no decisionCode AND no internalDecisionCode in results[] which would match as YES
      const isMatch = decision.decisionCode ? !noMatchInternalDecisionCodes.includes(decision.internalDecisionCode) : false

      return {
        id: randomUUID(),
        decision: getDecision(decision.decisionCode),
        decisionDetail: getDecisionDescription(decision.decisionCode, notificationStatus, isIuuOutcome, allDecisionCodesAreNoMatch, iuuRelatedChedpCheck),
        decisionReason: decision.decisionReason,
        departmentCode: checkCodeToAuthorityMapping[decision.checkCode],
        documentReference: isIuuOutcome ? null : decision.documentReference,
        isIuuOutcome,
        requiresChed: decision.documentReference == null && decision.checkCode === 'H220',
        match: isIuuOutcome ? null : isMatch
      }
    }).sort((a, b) => a.isIuuOutcome - b.isIuuOutcome)

  return {
    id: randomUUID(),
    ...commodity,
    weightOrQuantity: determineWeightOrQuantity(commodity, decisions),
    decisions: clearanceDecisions
  }
}

const mapCustomsDeclaration = (declaration, notificationStatuses) => {
  const { clearanceRequest, clearanceDecision, finalisation } = declaration
  const updated = format(declaration.updated, DATE_FORMAT)
  const commodities = clearanceRequest.commodities
    .map(commodity => mapCommodity(commodity, notificationStatuses, clearanceDecision))

  const status = getCustomsDeclarationStatus(finalisation)
  const open = getCustomsDeclarationOpenState(finalisation)

  return {
    movementReferenceNumber: declaration.movementReferenceNumber,
    declarationUcr: clearanceRequest.declarationUcr,
    status,
    updated,
    open,
    finalState: finalisation?.finalState,
    commodities
  }
}

export const mapCustomsDeclarations = ({ customsDeclarations, importPreNotifications }) => {
  const notificationStatuses = importPreNotifications
    .reduce((statuses, { importPreNotification }) => {
      const ref = importPreNotification.referenceNumber.split('.').pop()
      statuses[ref] = importPreNotification.status
      return statuses
    }, {})

  return customsDeclarations
    .map((declaration) => mapCustomsDeclaration(declaration, notificationStatuses))
}
