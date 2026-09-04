import { format } from 'date-fns'
import { DATE_FORMAT } from './model-constants.js'
import { sortDescending } from './sort.js'

const CHED_CLASSIFICATION_SYSTEM_ID = 'CN'

const mapClassificationToCommodityCode = (classifications) => {
  const classification = classifications?.find(
    ({ systemId }) => systemId === CHED_CLASSIFICATION_SYSTEM_ID
  )
  return classification?.classCode?.value
}

const mapCommodity = (tradeLineItem) => ({
  itemNumber: typeof tradeLineItem?.sequenceNumeric === 'number' ? tradeLineItem.sequenceNumeric : undefined,
  commodityCode: mapClassificationToCommodityCode(tradeLineItem?.applicableClassification),
  description: tradeLineItem?.scientificName ?? undefined,
  quantityWeight: tradeLineItem?.grossWeight?.content && tradeLineItem?.grossWeight?.unitCode
    ? `${tradeLineItem.grossWeight.content} ${tradeLineItem.grossWeight.unitCode}`
    : undefined
})

const mapTracesChed = ({ ched }) => ({
  reference: ched?.exchangedDocument?.identifier,
  status: ched?.exchangedDocument?.documentStatusCode,
  updated: ched?.lastUpdated ? format(new Date(ched.lastUpdated), DATE_FORMAT) : undefined,
  commodities: (ched?.specifiedConsignment?.includedConsignmentItem ?? []).flatMap(
    (consignmentItem) => consignmentItem?.includedTradeLineItem ?? []
  ).map(mapCommodity)
})

const isSearchTermMatch = (searchTerm, tracesChed) =>
  tracesChed.reference?.toUpperCase() === searchTerm

export const mapTracesCheds = ({ cheds = [] }, searchTerm) =>
  cheds
    .map(mapTracesChed)
    .sort(sortDescending(searchTerm, isSearchTermMatch))