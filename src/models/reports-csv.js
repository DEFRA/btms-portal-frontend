import { Transform } from 'node:stream'
import { parser } from 'stream-json'
import { pick } from 'stream-json/filters/pick.js'
import { streamArray } from 'stream-json/streamers/stream-array.js'
import { formatReportingDate } from '../utils/dates.js'
import {
  NO_MATCH_CSV,
  MANUAL_RELEASE_CSV,
  LEVEL_MATCHING_CSV
} from '../routes/route-constants.js'

const headings = {
  [NO_MATCH_CSV]: 'No matches',
  [MANUAL_RELEASE_CSV]: 'Manual releases',
  [LEVEL_MATCHING_CSV]: 'Level No Matches'
}

export const mapReportsCsv = (res, name, startDate, endDate, mapRowHandler, reportHeaders) => {
  const from = formatReportingDate(startDate)
  const to = formatReportingDate(endDate)

  let firstRow = true
  const toCsv = new Transform({
    writableObjectMode: true,
    transform({ value }, _, callback) {
      const row = mapRowHandler(value)

      if (firstRow) {
        this.push(`BTMS - ${headings[name]} MRNs\n`)
        this.push(`Date range: ${from} to ${to}\n`)
        this.push('\n')
        this.push(reportHeaders)
        firstRow = false
      }
      this.push(row)
      callback()
    }
  })

  return res
    .pipe(parser.asStream())
    .pipe(pick.asStream({ filter: 'data' }))
    .pipe(streamArray.asStream())
    .pipe(toCsv)
}
