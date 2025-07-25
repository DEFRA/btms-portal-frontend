import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  IUUDocumentReferences,
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
const requiresChed = (check, documents) => check.checkCode === 'H220' && check.decisionCode === 'X00' && documents.length === 0

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
    return 'Current'
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

const mapCommodity = (commodity, notificationStatuses, clearanceDecision) => {
  const documents = (commodity.documents || [])
    .reduce((docs, doc) => {
      const references = docs[doc.documentReference] || []
      docs[doc.documentReference] = [...new Set(references.concat(doc.documentCode))]
      return docs
    }, {})

  const weightOrQuantity = Number(commodity.netMass)
    ? commodity.netMass
    : commodity.supplementaryUnits

  const decisionChecks = clearanceDecision
    ? clearanceDecision.items
      .filter(({ itemNumber }) => itemNumber === commodity.itemNumber)
      .flatMap(({ checks }) => checks)
    : []

  const checksWithDecisionCodes = commodity.checks.map((check) => {
    const decision = decisionChecks
      .find(({ checkCode }) => checkCode === check.checkCode)

    return {
      ...check,
      decisionCode: decision?.decisionCode,
      decisionReasons: decision?.decisionReasons
    }
  })

  const allDecisionCodesAreNoMatch = checksWithDecisionCodes.every((check) => {
    return check.decisionCode === 'X00'
  })

  const iuuRelatedChedpCheck = checksWithDecisionCodes.find((check) => check.checkCode === 'H222')

  const decisions = checksWithDecisionCodes.map(check => {
    const relevantDocuments = checkCodeToDocumentCodeMapping[check.checkCode]
    const checkDocuments = (commodity.documents || []).filter(doc => relevantDocuments.includes(doc.documentCode))
    const documentReference = (checkDocuments.length > 0) ? checkDocuments[0].documentReference : null
    const documentReferenceId = documentReference ? extractDocumentReferenceId(documentReference) : null
    const notificationStatus = documentReferenceId ? notificationStatuses[documentReferenceId] : null

    const isIuuOutcome = relevantDocuments.some(doc => IUUDocumentReferences.includes(doc))

    const outcome = {
      decision: getDecision(check.decisionCode),
      decisionDetail: getDecisionDescription(check.decisionCode, notificationStatus, isIuuOutcome, allDecisionCodesAreNoMatch, iuuRelatedChedpCheck),
      decisionReason: check.decisionReasons?.length > 0 ? check.decisionReasons[0] : null,
      departmentCode: checkCodeToAuthorityMapping[check.checkCode],
      isIuuOutcome: relevantDocuments.some(doc => IUUDocumentReferences.includes(doc)),
      requiresChed: requiresChed(check, checkDocuments)
    }

    return {
      id: randomUUID(),
      documentReference: isIuuOutcome ? null : documentReference,
      outcome,
      match: isIuuOutcome ? null : Boolean(notificationStatus)
    }
  }).sort((a, b) => a.outcome.isIuuOutcome - b.outcome.isIuuOutcome)

  return {
    id: randomUUID(),
    ...commodity,
    documents,
    weightOrQuantity,
    decisions
  }
}

const mapCustomsDeclaration = (declaration, notificationStatuses) => {
  const { clearanceRequest, clearanceDecision, finalisation } = declaration
  const updated = format(declaration.updated, DATE_FORMAT)
  const commodities = clearanceRequest.commodities
    .map((commodity) => mapCommodity(commodity, notificationStatuses, clearanceDecision))

  const status = getCustomsDeclarationStatus(finalisation)
  const open = getCustomsDeclarationOpenState(finalisation)

  return {
    movementReferenceNumber: declaration.movementReferenceNumber,
    declarationUcr: clearanceRequest.declarationUcr,
    status,
    updated,
    open,
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
