import { format } from 'date-fns'
import {
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  checkCodeToAuthorityMapping,
  finalStateMappings,
  IUUDocumentReferences,
  DATE_FORMAT
} from './model-constants.js'

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

export const getDecisionDescription = (decisionCode) => {
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

export const getCustomsDeclarationStatus = (finalisation) => {
  if (finalisation === null) {
    return 'Current'
  }

  if (finalisation.isManualRelease === true) {
    return 'Finalised - Manually released'
  }

  return `Finalised - ${finalStateMappings[finalisation.finalState]}`
}

const mapCommodity = (commodity, notificationReferences, clearanceDecision) => {
  const documents = commodity.documents
    .filter(({ documentCode }) => !IUUDocumentReferences.includes(documentCode))
    .reduce((docs, doc) => {
      const references = docs[doc.documentReference] || []
      docs[doc.documentReference] = [...new Set(references.concat(doc.documentCode))]
      return docs
    }, {})

  const weightOrQuantity = Number(commodity.netMass)
    ? commodity.netMass
    : commodity.supplementaryUnits

  const decisonChecks = clearanceDecision
    ? clearanceDecision.items
      .filter(({ itemNumber }) => itemNumber === commodity.itemNumber)
      .flatMap(({ checks }) => checks)
    : []

  const checksWithDecisionCodes = commodity.checks.map((check) => {
    const decision = decisonChecks
      .find(({ checkCode }) => checkCode === check.checkCode)

    return {
      ...check,
      decisionCode: decision?.decisionCode
    }
  })

  const decisions = Object.entries(documents).map(([documentReference, documentCodes]) => {
    const lastSeven = 7

    return {
      documentReference,
      outcomes: documentCodes.flatMap((documentCode) => {
        const checks = checksWithDecisionCodes.filter(({ checkCode }) =>
          checkCodeToDocumentCodeMapping[checkCode].includes(documentCode)
        )

        return checks.map(({ checkCode, decisionCode }) => ({
          decision: getDecisionDescription(decisionCode),
          decisionDetail: decisionCodeDescriptions[decisionCode],
          departmentCode: checkCodeToAuthorityMapping[checkCode]
        }))
      }),
      match: notificationReferences.includes(documentReference.slice(-lastSeven))
    }
  })

  return {
    ...commodity,
    documents,
    weightOrQuantity,
    decisions
  }
}

const mapCustomsDeclaration = (declaration, notificationReferences) => {
  const { clearanceRequest, clearanceDecision, finalisation } = declaration
  const updated = format(declaration.updated, DATE_FORMAT)
  const commodities = clearanceRequest.commodities
    .map((commodity) => mapCommodity(commodity, notificationReferences, clearanceDecision))

  const status = getCustomsDeclarationStatus(finalisation)
  const open = status !== 'Cancelled'

  return {
    movementReferenceNumber: declaration.movementReferenceNumber,
    declarationUcr: clearanceRequest.declarationUcr,
    status,
    updated,
    open,
    commodities
  }
}

export const mapCustomsDeclarations = (data) => {
  const notificationReferences = data.importPreNotifications
    .map(({ importPreNotification }) => importPreNotification.referenceNumber.split('.').pop())

  return data.customsDeclarations
    .map((declaration) => mapCustomsDeclaration(declaration, notificationReferences))
}
