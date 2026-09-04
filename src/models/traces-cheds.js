import { format } from 'date-fns'
import { DATE_FORMAT } from './model-constants.js'
import { sortDescending } from './sort.js'

const mapTracesChed = ({ ched, updated }) => ({
  reference: ched?.exchangedDocument?.identifier,
  updated: format(new Date(updated), DATE_FORMAT)
})

const isSearchTermMatch = (searchTerm, tracesChed) =>
  tracesChed.reference?.toUpperCase() === searchTerm

export const mapTracesCheds = ({ cheds = [] }, searchTerm) =>
  cheds
    .map(mapTracesChed)
    .sort(sortDescending(searchTerm, isSearchTermMatch))
