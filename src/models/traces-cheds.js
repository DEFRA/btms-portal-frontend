import { format } from 'date-fns'
import {
  DATE_FORMAT,
  DECISION_NOT_GIVEN,
  TRACES_CHED_STATUS,
  tracesDecisionConclusionDescriptions
} from './model-constants.js'
import { sortDescending } from './sort.js'

const CHED_CLASSIFICATION_SYSTEM_ID = 'CN'
const DECISION_CONCLUSION_CLAUSE_ID = 'DECISION_CONCLUSION'

const IN_PROGRESS_STATUS = 'In progress'

// Single source of the TRACES CHED status, used by both the search result screen and the timeline.
export const getTracesChedStatus = (documentStatusCode) => { //NOSONAR - readability
  switch (`${documentStatusCode}`) {
    case '1': return 'New'
    case '35': return 'Authorised for onward travel'
    case '41': return 'Rejected'
    case '42': return IN_PROGRESS_STATUS
    case '44': return 'Replaced'
    case '47': return 'Draft'
    case '55': return 'Deleted'
    case '64': return 'Cancelled'
    case '68': return 'Split'
    case '70': return 'Validated'
    case '97': return 'Authorised for onward transportation'
    case '99': return 'Authorised for transit'
    case '122': return 'Partially rejected'
    case '124': return 'Authorised for transfer to'
    case '146': return 'Authorised for transhipment'
    default: return `Unknown (${documentStatusCode})`
  }
}


const findCnClassification = (classifications) =>
  classifications?.find(({ systemId }) => systemId === CHED_CLASSIFICATION_SYSTEM_ID)

// The first line i've seen in TRACES CHEDs is a total
// This filters out anything that doesn't look like a commodity
const isCommodityLine = (tradeLineItem) =>
  Boolean(findCnClassification(tradeLineItem?.applicableClassification))

const mapCommodity = (tradeLineItem, decision) => {
  const cnClassification = findCnClassification(tradeLineItem?.applicableClassification)
  const { netWeight, netVolume } = tradeLineItem

  return {
    itemNumber: typeof tradeLineItem?.sequenceNumeric === 'number' ? tradeLineItem.sequenceNumeric : undefined,
    commodityCode: cnClassification?.classCode?.value,
    description: (tradeLineItem?.scientificName || cnClassification?.className?.[0]) ?? "UNKNOWN",
    quantityOrWeight: netWeight?.content ? `${netWeight.content} ${netWeight.unitCode}` : netVolume?.content,
    decision
  }
}

const getDecision = (ched, documentStatusCode, customsDeclarations) => {
  const tracesChedReference = ched?.exchangedDocument?.identifier
  const hasAssociatedCustomsDeclaration = customsDeclarations?.some(declaration =>
    declaration?.clearanceRequest?.commodities?.some(commodity =>
      commodity?.documents?.some(document =>
        document.documentReference === tracesChedReference)))

  if ((documentStatusCode === TRACES_CHED_STATUS.NEW || documentStatusCode === TRACES_CHED_STATUS.IN_PROGRESS) && !hasAssociatedCustomsDeclaration) {
    return DECISION_NOT_GIVEN
  }

  const content = ched?.exchangedDocument
    ?.secondSignatoryAuthentication?.includedClause
    ?.find(({ identifier }) => identifier === DECISION_CONCLUSION_CLAUSE_ID)?.content

  return content ? (tracesDecisionConclusionDescriptions[content] ?? `Unknown (${content})`) : undefined
}

const mapTracesChed = ({ ched }, customsDeclarations) => {
  const documentStatusCode = ched?.exchangedDocument?.documentStatusCode
  const decision = getDecision(ched, documentStatusCode, customsDeclarations) ?? DECISION_NOT_GIVEN

  return {
    reference: ched?.exchangedDocument?.identifier,
    status: getTracesChedStatus(documentStatusCode),
    updated: ched?.lastUpdated ? format(new Date(ched.lastUpdated), DATE_FORMAT) : undefined,
    commodities: (ched?.specifiedConsignment?.includedConsignmentItem ?? []).flatMap(
      (consignmentItem) => consignmentItem?.includedTradeLineItem ?? []
    ).filter(isCommodityLine).map((tradeLineItem) => mapCommodity(tradeLineItem, decision))
  }
}

const isSearchTermMatch = (searchTerm, tracesChed) =>
  tracesChed.reference?.toUpperCase() === searchTerm

export const mapTracesCheds = ({ cheds = [], customsDeclarations = [] }, searchTerm) =>
  cheds
    .map(ched => mapTracesChed(ched, customsDeclarations))
    .sort(sortDescending(searchTerm, isSearchTermMatch))
