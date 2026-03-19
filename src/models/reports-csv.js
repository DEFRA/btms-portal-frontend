import { Transform } from 'node:stream'
import streamJson from 'stream-json'
import pickFilter from 'stream-json/filters/Pick.js'
import streamArrayStreamers from 'stream-json/streamers/StreamArray.js'
import { format } from 'date-fns'
import { formatReportingDate } from '../utils/dates.js'
import { NO_MATCH_CSV, MANUAL_RELEASE_CSV } from '../routes/route-constants.js'

const { parser } = streamJson
const { pick } = pickFilter
const { streamArray } = streamArrayStreamers

const headings = {
  [NO_MATCH_CSV]: 'No matches',
  [MANUAL_RELEASE_CSV]: 'Manual releases'
}

export const mapReportsCsv = (res, name, startDate, endDate) => {
  const from = formatReportingDate(startDate)
  const to = formatReportingDate(endDate)

  let firstRow = true
  const toCsv = new Transform({
    writableObjectMode: true,
    transform({ value }, _, callback) {
      const row =
        [
          `"${format(new Date(value.timestamp), 'dd MMMM yy, HH:mm')}"`,
          value.mrn,
          value.itemNumber,
          value.commodityCode,
          value.description,
          value.quantityOrWeight,
          value.chedReference,
          value.checkCode,
          value.match,
          value.authority,
          value.decision,
          value.decisionReasons,

        ].join(',') + '\n'

      if (firstRow) {
        this.push(`BTMS - ${headings[name]} MRNs\n`)
        this.push(`Date range: ${from} to ${to}\n`)
        this.push('\n')
        this.push('Last updated,MRN,Item number,Commodity code,Description,Quantity/Weight,CHED reference,Check code,Match,Authority,Decision,Decision reason\n')
        firstRow = false
      }
      this.push(row)
      callback()
    }
  })

  return res
    .pipe(parser())
    .pipe(pick({ filter: 'data' }))
    .pipe(streamArray())
    .pipe(toCsv)
}
