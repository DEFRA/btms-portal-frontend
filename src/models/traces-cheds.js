import { format } from 'date-fns'
import {
  DATE_FORMAT,
  DECISION_NOT_GIVEN,
  tracesChedStatusCodeDescriptions,
  tracesDecisionConclusionDescriptions
} from './model-constants.js'
import { sortDescending } from './sort.js'

const CHED_CLASSIFICATION_SYSTEM_ID = 'CN'
const DECISION_CONCLUSION_CLAUSE_ID = 'DECISION_CONCLUSION'


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

const getDecision = (ched) => {
  const content = ched?.exchangedDocument
    ?.secondSignatoryAuthentication?.includedClause
    ?.find(({ identifier }) => identifier === DECISION_CONCLUSION_CLAUSE_ID)?.content

  return content ? (tracesDecisionConclusionDescriptions[content] ?? `Unknown (${content})`) : undefined
}

const mapTracesChed = ({ ched }) => {
  const documentStatusCode = ched?.exchangedDocument?.documentStatusCode
  const decision = getDecision(ched) ?? DECISION_NOT_GIVEN

  return {
    reference: ched?.exchangedDocument?.identifier,
    status: tracesChedStatusCodeDescriptions[documentStatusCode] ?? `Unknown (${documentStatusCode})`,
    updated: ched?.lastUpdated ? format(new Date(ched.lastUpdated), DATE_FORMAT) : undefined,
    commodities: (ched?.specifiedConsignment?.includedConsignmentItem ?? []).flatMap(
      (consignmentItem) => consignmentItem?.includedTradeLineItem ?? []
    ).filter(isCommodityLine).map((tradeLineItem) => mapCommodity(tradeLineItem, decision))
  }
}

const isSearchTermMatch = (searchTerm, tracesChed) =>
  tracesChed.reference?.toUpperCase() === searchTerm

export const mapTracesCheds = ({ cheds = [] }, searchTerm) =>
  cheds
    .map(mapTracesChed)
    .sort(sortDescending(searchTerm, isSearchTermMatch))
