import { randomUUID } from 'node:crypto'
import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  closedChedStatuses,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  IUUDocumentReferences,
  DATE_FORMAT,
  ILLEGAL_UNREPORTED_UNREGULATED
} from './model-constants.js'

const isIUU = ({ departmentCode }) =>
  departmentCode === ILLEGAL_UNREPORTED_UNREGULATED

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

export const getDecisionDescription = (decisionCode, notificationStatus) => {
  if (closedChedStatuses.includes(notificationStatus)) {
    return `CHED ${notificationStatus.toLowerCase()}`
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

export const getCustomsDeclarationOpenState = (finalisation) =>
  !(
    finalisation !== null &&
    finalisation.isManualRelease === false &&
    (finalisation.finalState === '1' || finalisation.finalState === '2')
  )

const mapCommodity = (commodity, notificationStatuses, clearanceDecision) => {
  const documents = commodity.documents.reduce((docs, doc) => {
    const references = docs[doc.documentReference] || []
    docs[doc.documentReference] = [
      ...new Set(references.concat(doc.documentCode))
    ]
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
    const decision = decisionChecks.find(
      ({ checkCode }) => checkCode === check.checkCode
    )

    return {
      ...check,
      decisionCode: decision?.decisionCode
    }
  })

  const decisions = Object.entries(documents)
    .map(([documentReference, documentCodes]) => {
      const lastSeven = 7
      const notificationStatus =
        notificationStatuses[documentReference.slice(-lastSeven)]

      const outcomes = documentCodes
        .sort(
          (a, b) =>
            Number(IUUDocumentReferences.includes(a)) -
            Number(IUUDocumentReferences.includes(b))
        )
        .flatMap((documentCode) => {
          const checks = checksWithDecisionCodes.filter(({ checkCode }) =>
            checkCodeToDocumentCodeMapping[checkCode].includes(documentCode)
          )

          return checks.map(({ checkCode, decisionCode }) => ({
            decision: getDecision(decisionCode),
            decisionDetail: getDecisionDescription(
              decisionCode,
              notificationStatus
            ),
            departmentCode: checkCodeToAuthorityMapping[checkCode]
          }))
        })

      const hasOnlyIuuOutcome = outcomes.length === 1 && isIUU(outcomes[0])
      return {
        id: randomUUID(),
        documentReference: hasOnlyIuuOutcome ? null : documentReference,
        outcomes,
        match: hasOnlyIuuOutcome ? null : Boolean(notificationStatus)
      }
    })
    .sort(
      (a, b) => Number(a.outcomes.some(isIUU)) - Number(b.outcomes.some(isIUU))
    )

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
  const commodities = clearanceRequest.commodities.map((commodity) =>
    mapCommodity(commodity, notificationStatuses, clearanceDecision)
  )

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
