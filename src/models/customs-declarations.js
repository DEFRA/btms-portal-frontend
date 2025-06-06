import { format } from 'date-fns'
import {
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
  const decisionDetail = decisionCodeDescriptions[decisionCode]
  let decisionHighLevelDesc
  if (isReleaseDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Release - '
  } else if (isRefusalDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Refusal - '
  } else if (isErrorDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Data error - '
  } else if (isHoldDecisionCode(decisionCode)) {
    decisionHighLevelDesc = 'Hold - '
  } else {
    decisionHighLevelDesc = ''
  }

  return `${decisionHighLevelDesc}${decisionDetail}` || 'Unknown'
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

const getMatchStatus = (documentReferences, notificationReferences) => {
  if (!notificationReferences.length) {
    return { isMatched: false, unmatchedDocRefs: documentReferences }
  }
  // example document reference: GBCHD2024.1234567 or GB.2024.1234567
  const refMatchLength = 7
  const unmatchedDocRefs = documentReferences.filter(docRef =>
    !notificationReferences.includes(docRef.slice(-refMatchLength)))

  return { isMatched: !unmatchedDocRefs.length, unmatchedDocRefs }
}

const mapCommodity = (commodity, notificationReferences, clearanceDecision) => {
  const documents = [
    ...new Set(commodity.documents
      .filter(({ documentCode }) => !IUUDocumentReferences.includes(documentCode))
      .map(({ documentReference }) => documentReference)
    )
  ]

  const weightOrQuantity = Number(commodity.netMass)
    ? commodity.netMass
    : commodity.supplementaryUnits

  const matchStatus = getMatchStatus(documents, notificationReferences)

  const decisonChecks = clearanceDecision
    ? clearanceDecision.items
      .filter(({ itemNumber }) => itemNumber === commodity.itemNumber)
      .flatMap(({ checks }) => checks)
    : []

  const decisions = decisonChecks
    .map((check) => `${getDecisionDescription(check.decisionCode)} (${checkCodeToAuthorityMapping[check.checkCode]})`)

  return {
    ...commodity,
    documents,
    weightOrQuantity,
    matchStatus,
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
