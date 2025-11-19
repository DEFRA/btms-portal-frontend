import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  checkCodeToAuthorityNameMapping,
  finalStateMappings,
  hmiGmsInternalDecisionCodes,
  noMatchInternalDecisionCodes,
  internalDecisionCodeDescriptions,
  IUUDocumentCodes,
  DATE_FORMAT,
  NO_MATCH_DECISION_CODE,
  CDS_STATUSES
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
  const showQuantity = decisions.some((decision) => {
    const relevantDocCodes =
      checkCodeToDocumentCodeMapping[decision.checkCode] || []
    return relevantDocCodes.includes('C640')
  })

  const primary = showQuantity
    ? commodity.supplementaryUnits
    : commodity.netMass
  const fallbackValue = showQuantity
    ? commodity.netMass
    : commodity.supplementaryUnits

  if (primary == null || primary === 0 || primary === '0') {
    return Number(fallbackValue)
  }

  return Number(primary)
}

const hasDesiredPrefix = (decisionCode, desiredPrefix) => {
  return (
    decisionCode?.length && decisionCode.toLowerCase().startsWith(desiredPrefix)
  )
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

export const getDecision = (decisionCode, internalDecisionCode) => {
  let decisionHighLevelDesc

  if (internalDecisionCodeDescriptions[internalDecisionCode]) {
    return ''
  }

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

export const getDecisionDetail = (
  decisionCode,
  internalDecisionCode,
  notificationStatus,
  isIuuOutcome,
  allDecisionCodesAreNoMatch,
  iuuRelatedChedpCheck
) => {
  if (internalDecisionCodeDescriptions[internalDecisionCode]) {
    return internalDecisionCodeDescriptions[internalDecisionCode]
  }

  if (closedChedStatuses.includes(notificationStatus)) {
    return `CHED ${notificationStatus.toLowerCase()}`
  }

  if (isIuuOutcome && decisionCode === NO_MATCH_DECISION_CODE) {
    if (allDecisionCodesAreNoMatch) {
      return 'No match'
    }

    if (iuuRelatedChedpCheck?.decisionCode === 'H01') {
      return 'Hold - Decision not given'
    }

    if (iuuRelatedChedpCheck?.decisionCode === 'H02') {
      return 'Hold - To be inspected'
    }

    if (
      isReleaseDecisionCode(iuuRelatedChedpCheck?.decisionCode) ||
      isRefusalDecisionCode(iuuRelatedChedpCheck?.decisionCode)
    ) {
      return 'Refuse - IUU not compliant'
    }
  }

  return decisionCodeDescriptions[decisionCode]
}

export const getCustomsDeclarationStatus = (finalisation, clearanceDecision) => {
  if (finalisation === null) {
    return getInProgressDetail(clearanceDecision)
  }

  if (finalisation.isManualRelease === true) {
    return CDS_STATUSES.FINALISED_MANUALLY_RELEASED
  }

  return finalStateMappings[finalisation.finalState]
}

const getDocumentReference = (decision) =>
  hmiGmsInternalDecisionCodes.has(decision.internalDecisionCode)
    ? 'Requires CHED'
    : decision.documentReference

const getInProgressDetail = (clearanceDecision) => {
  if (clearanceDecision.items?.some(item => item.checks?.some(check => check.decisionCode === NO_MATCH_DECISION_CODE && check.checkCode !== 'H224'))) {
    return CDS_STATUSES.IN_PROGRESS_AWAITING_TRADER
  }

  if (clearanceDecision.items?.some(item => item.checks?.some(check => isHoldDecisionCode(check.decisionCode)))) {
    return CDS_STATUSES.IN_PROGRESS_AWAITING_IPAFFS
  }

  if (clearanceDecision.items?.every(item => item.checks?.every(check => isReleaseDecisionCode(check.decisionCode) || isRefusalDecisionCode(check.decisionCode)))) {
    return CDS_STATUSES.IN_PROGRESS_AWAITING_CDS
  }

  return CDS_STATUSES.IN_PROGRESS
}

export const getCustomsDeclarationOpenState = (finalisation) =>
  !(
    finalisation !== null &&
    finalisation.isManualRelease === false &&
    (finalisation.finalState === '1' || finalisation.finalState === '2')
  )

const mapCommodity = (commodity, notificationStatuses, clearanceDecision) => {
  const clearanceDecisions =
    clearanceDecision?.results.filter(
      ({ itemNumber }) => itemNumber === commodity.itemNumber
    ) || []

  const allDecisionCodesAreNoMatch = clearanceDecisions.every(
    (decision) => decision.decisionCode === NO_MATCH_DECISION_CODE
  )
  const iuuRelatedChedpCheck = clearanceDecisions.find(
    (decision) => decision.checkCode === 'H222'
  )

  const decisions = clearanceDecisions.map((decision) => {
    const documentReferenceId = decision.documentReference
      ? extractDocumentReferenceId(decision.documentReference)
      : null
    const notificationStatus = documentReferenceId
      ? notificationStatuses[documentReferenceId]
      : null
    const relevantDocCodes =
      checkCodeToDocumentCodeMapping[decision.checkCode] || []
    const isIuuOutcome = relevantDocCodes.some((code) =>
      IUUDocumentCodes.includes(code)
    )

    const isMatch = Boolean(
      decision.decisionCode &&
        !noMatchInternalDecisionCodes.has(decision.internalDecisionCode)
    )

    return {
      id: randomUUID(),
      checkCode: decision.checkCode,
      decision: getDecision(
        decision.decisionCode,
        decision.internalDecisionCode
      ),
      decisionDetail: getDecisionDetail(
        decision.decisionCode,
        decision.internalDecisionCode,
        notificationStatus,
        isIuuOutcome,
        allDecisionCodesAreNoMatch,
        iuuRelatedChedpCheck
      ),
      decisionReason: decision.decisionReason,
      authority: {
        text: checkCodeToAuthorityNameMapping[decision.checkCode] || checkCodeToAuthorityMapping[decision.checkCode],
        value: checkCodeToAuthorityMapping[decision.checkCode]
      },
      documentReference: isIuuOutcome ? null : getDocumentReference(decision),
      match: isIuuOutcome ? null : isMatch
    }
  })

  return {
    id: randomUUID(),
    ...commodity,
    weightOrQuantity: determineWeightOrQuantity(commodity, decisions),
    decisions
  }
}

const mapCustomsDeclaration = (declaration, notificationStatuses) => {
  const { clearanceRequest, clearanceDecision, finalisation } = declaration
  const updated = format(declaration.updated, DATE_FORMAT)
  const commodities = clearanceRequest.commodities.map((commodity) =>
    mapCommodity(commodity, notificationStatuses, clearanceDecision)
  )

  const status = getCustomsDeclarationStatus(finalisation, clearanceDecision)
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

export const mapCustomsDeclarations = ({
  customsDeclarations,
  importPreNotifications
}) => {
  const notificationStatuses = importPreNotifications.reduce(
    (statuses, { importPreNotification }) => {
      const ref = importPreNotification.referenceNumber.split('.').pop()
      statuses[ref] = importPreNotification.status
      return statuses
    },
    {}
  )

  return customsDeclarations.map((declaration) =>
    mapCustomsDeclaration(declaration, notificationStatuses)
  )
}
