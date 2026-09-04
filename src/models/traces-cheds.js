import { format } from 'date-fns'
import { DATE_FORMAT } from './model-constants.js'
import { sortDescending } from './sort.js'

const CHED_CLASSIFICATION_SYSTEM_ID = 'CN'

const findCnClassification = (classifications) =>
  classifications?.find(({ systemId }) => systemId === CHED_CLASSIFICATION_SYSTEM_ID)

// The first line i've seen in TRACES CHEDs is a total
// This filters out anything that doesn't look like a commodity
const isCommodityLine = (tradeLineItem) =>
  Boolean(findCnClassification(tradeLineItem?.applicableClassification))

const mapCommodity = (tradeLineItem) => ({
  itemNumber: typeof tradeLineItem?.sequenceNumeric === 'number' ? tradeLineItem.sequenceNumeric : undefined,
  commodityCode: findCnClassification(tradeLineItem?.applicableClassification)?.classCode?.value,
  description: tradeLineItem?.scientificName ?? undefined,
  quantityWeight: tradeLineItem?.netWeight?.content && tradeLineItem?.netWeight?.unitCode
    ? `${tradeLineItem.netWeight.content} ${tradeLineItem.netWeight.unitCode}`
    : undefined
})

const mapTracesChed = ({ ched }) => ({
  reference: ched?.exchangedDocument?.identifier,
  status: ched?.exchangedDocument?.documentStatusCode,
  updated: ched?.lastUpdated ? format(new Date(ched.lastUpdated), DATE_FORMAT) : undefined,
  commodities: (ched?.specifiedConsignment?.includedConsignmentItem ?? []).flatMap(
    (consignmentItem) => consignmentItem?.includedTradeLineItem ?? []
  ).filter(isCommodityLine).map(mapCommodity)
})

const isSearchTermMatch = (searchTerm, tracesChed) =>
  tracesChed.reference?.toUpperCase() === searchTerm

export const mapTracesCheds = ({ cheds = [] }, searchTerm) =>
  cheds
    .map(mapTracesChed)
    .sort(sortDescending(searchTerm, isSearchTermMatch))
