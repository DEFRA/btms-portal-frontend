import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  hmiGmsInternalDecisionCodes,
  noMatchInternalDecisionCodes,
  internalDecisionCodeDescriptions,
  IUUDocumentCodes,
  DATE_FORMAT,
  NO_MATCH_DECISION_CODE
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
    return `In progress${getInProgressDetail(clearanceDecision)}`
  }

  if (finalisation.isManualRelease === true) {
    return 'Finalised - Manually released'
  }

  return `Finalised - ${finalStateMappings[finalisation.finalState]}`
}

const getDocumentReference = (decision) =>
  hmiGmsInternalDecisionCodes.has(decision.internalDecisionCode)
    ? 'Requires CHED'
    : decision.documentReference

const getInProgressDetail = (clearanceDecision) => {
  if (clearanceDecision.items?.some(item => item.checks?.some(check => check.decisionCode === NO_MATCH_DECISION_CODE && check.checkCode !== 'H224'))) {
    return ' - Awaiting trader'
  }

  if (clearanceDecision.items?.some(item => item.checks?.some(check => isHoldDecisionCode(check.decisionCode)))) {
    return ' - Awaiting IPAFFS'
  }

  if (clearanceDecision.items?.every(item => item.checks?.every(check => isReleaseDecisionCode(check.decisionCode) || isRefusalDecisionCode(check.decisionCode)))) {
    return ' - Awaiting CDS'
  }

  return ''
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
      departmentCode: checkCodeToAuthorityMapping[decision.checkCode],
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

const getBtmsDecision = (clearanceDecision) => {
  for (const decisionCheck of btmsDecisionChecks) {
    if (decisionCheck.checkType === 'item' && clearanceDecision.items.some(item => item.checks.some(itemCheck =>
        itemCheck.decisionCode === decisionCheck.decisionCode && (decisionCheck.checkCode === undefined || itemCheck.checkCode === decisionCheck.checkCode)))) {
      return decisionCheck.decision
    }

    if (decisionCheck.checkType === 'result' && clearanceDecision.results.some(result => result.internalDecisionCode === decisionCheck.decisionCode)) {
      return decisionCheck.decision
    }
  }

  return ''
}

// Order of these checks matter. It returns the 'worst' case of all the item decisions first.
const btmsDecisionChecks = [
  { checkType: 'item', decisionCode: 'E03', decision: 'Data Error - Unexpected data - transit, transhipment or specific warehouse' },
  { checkType: 'item', decisionCode: 'N01', decision: 'Refuse - Not acceptable' },
  { checkType: 'item', decisionCode: 'N02', decision: 'Refuse - Destroy' },
  { checkType: 'item', decisionCode: 'N03', decision: 'Refuse - Transform' },
  { checkType: 'item', decisionCode: 'N04', decision: 'Refuse - Re-export or re-dispatch' },
  { checkType: 'item', decisionCode: 'N05', decision: 'Refuse - Use for other purposes' },
  { checkType: 'item', decisionCode: 'N06', decision: 'Refuse - Refused' },
  { checkType: 'item', decisionCode: 'N07', decision: 'Refuse - Not acceptable' },
  { checkType: 'item', decisionCode: 'X00', checkCode: 'H224', decision: 'Refuse - IUU not compliant' },
  { checkType: 'result', decisionCode: 'E70', decision: 'No match - CHED cannot be found' },
  { checkType: 'result', decisionCode: 'E71', decision: 'No match - CHED cancelled' },
  { checkType: 'result', decisionCode: 'E72', decision: 'No match - CHED replaced' },
  { checkType: 'result', decisionCode: 'E73', decision: 'No match - CHED deleted' },
  { checkType: 'result', decisionCode: 'E75', decision: 'No match - Split consignment' },
  { checkType: 'result', decisionCode: 'E87', decision: 'No match - Selected for HMI GMS inspection' },
  { checkType: 'result', decisionCode: 'E84', decision: 'No match - Incorrect CHED type' },
  { checkType: 'result', decisionCode: 'E99', decision: 'No match - Unknown error' },
  { checkType: 'item', decisionCode: 'H01', decision: 'Hold - Decision not given' },
  { checkType: 'item', decisionCode: 'H02', decision: 'Hold - To be inspected' },
  { checkType: 'result', decisionCode: 'E88', decision: 'Hold - Awaiting IPAFFS update' },
  { checkType: 'result', decisionCode: 'E74', decision: 'Hold - Partially rejected' },
  { checkType: 'result', decisionCode: 'E85', decision: 'Hold - PHSI decision not provided' },
  { checkType: 'result', decisionCode: 'E86', decision: 'Hold - HMI decision not provided' },
  { checkType: 'item', decisionCode: 'C02', decision: 'Release - No inspection required' },
  { checkType: 'item', decisionCode: 'C03', decision: 'Release - Inspection complete' },
  { checkType: 'item', decisionCode: 'C05', decision: 'Release - Inspection complete temporary admission' },
  { checkType: 'item', decisionCode: 'C06', decision: 'Release - Inspection complete T5 procedure' },
  { checkType: 'item', decisionCode: 'C07', decision: 'Release - IUU inspection complete' },
  { checkType: 'item', decisionCode: 'C08', decision: 'Release - IUU inspection not applicable' }
]

export const mapGmrCustomsDeclarations = ({
  customsDeclarations,
  goodsVehicleMovements
}) => {
  return goodsVehicleMovements[0]?.gmr?.declarations.customs.map((gmrCustomsDeclaration) => {
    const customsDeclaration = customsDeclarations.find(declaration => declaration.movementReferenceNumber?.toLowerCase() === gmrCustomsDeclaration.id?.toLowerCase())
    const isKnownMrn = customsDeclaration !== undefined
    const cdsStatus = isKnownMrn ? getCustomsDeclarationStatus(customsDeclaration.finalisation, customsDeclaration.clearanceDecision) : 'Unknown'
    const btmsDecision = isKnownMrn ? getBtmsDecision(customsDeclaration?.clearanceDecision) : 'Unknown'

    return {
      isKnownMrn,
      mrn: gmrCustomsDeclaration.id,
      cdsStatus,
      btmsDecision,
      finalState: customsDeclaration?.finalisation?.finalState
    }
  })
}
