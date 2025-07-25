import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  finalStateMappings,
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

const mapLegacyDecisions = (commodity, clearanceDecision) => {
  return commodity.checks.map(check => {
    const associatedDocumentCodes = checkCodeToDocumentCodeMapping[check.checkCode]
    const associatedDocuments = (commodity.documents || []).filter(doc => associatedDocumentCodes.includes(doc.documentCode))

    if (associatedDocuments.length === 0) {
      const clearanceDecisionCheck = clearanceDecision?.checks.find(({ checkCode }) => checkCode === check.checkCode)
      return [
        {
          itemNumber: commodity.itemNumber,
          documentReference: null,
          checkCode: check.checkCode,
          decisionCode: clearanceDecisionCheck?.decisionCode,
          decisionReason: clearanceDecisionCheck?.decisionReasons?.length > 0 ? clearanceDecisionCheck?.decisionReasons[0] : null
        }
      ]
    }

    return associatedDocuments.map(doc => {
      const decision = clearanceDecision?.checks.find(({ checkCode }) => checkCode === check.checkCode)

      return {
        itemNumber: commodity.itemNumber,
        documentReference: doc.documentReference,
        checkCode: check.checkCode,
        decisionCode: decision?.decisionCode,
        decisionReason: decision?.decisionReasons?.length > 0 ? decision?.decisionReasons[0] : null
      }
    })
  }).flat()
}

const mapCommodity = (commodity, notificationStatuses, clearanceDecision) => {
  const decisions = clearanceDecision?.results && clearanceDecision.results.length > 0 ? clearanceDecision.results : mapLegacyDecisions(commodity, clearanceDecision)
  const allDecisionCodesAreNoMatch = decisions.every(decision => decision.decisionCode === 'X00')
  const iuuRelatedChedpCheck = decisions.find(decision => decision.checkCode === 'H222')

  const clearanceDecisions = decisions.filter(result => result.itemNumber === commodity.itemNumber)
    .map(decision => {
      const documentReferenceId = decision.documentReference ? extractDocumentReferenceId(decision.documentReference) : null
      const notificationStatus = documentReferenceId ? notificationStatuses[documentReferenceId] : null
      const relevantDocCodes = checkCodeToDocumentCodeMapping[decision.checkCode]
      const isIuuOutcome = relevantDocCodes.some(code => IUUDocumentCodes.includes(code))

      return {
        id: randomUUID(),
        decision: getDecision(decision.decisionCode),
        decisionDetail: getDecisionDescription(decision.decisionCode, notificationStatus, isIuuOutcome, allDecisionCodesAreNoMatch, iuuRelatedChedpCheck),
        decisionReason: decision.decisionReason,
        departmentCode: checkCodeToAuthorityMapping[decision.checkCode],
        documentReference: isIuuOutcome ? null : decision.documentReference,
        isIuuOutcome,
        requiresChed: decision.documentReference == null && decision.checkCode === 'H220',
        match: isIuuOutcome ? null : Boolean(notificationStatus)
      }
    }).sort((a, b) => a.isIuuOutcome - b.isIuuOutcome)

  return {
    id: randomUUID(),
    ...commodity,
    weightOrQuantity: Number(commodity.netMass)
      ? commodity.netMass
      : commodity.supplementaryUnits,
    decisions: clearanceDecisions
  }
}

const mapCustomsDeclaration = (declaration, notificationStatuses) => {
  const { clearanceRequest, clearanceDecision, finalisation } = declaration
  const updated = format(declaration.updated, DATE_FORMAT)
  const commodities = clearanceRequest.commodities
    .map(commodity => mapCommodity(commodity, notificationStatuses, (clearanceDecision?.items || []).find(({ itemNumber }) => itemNumber === commodity.itemNumber)))

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
