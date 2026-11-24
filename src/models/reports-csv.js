import { Transform } from 'node:stream'
import { parser } from 'stream-json'
import { pick } from 'stream-json/filters/pick.js'
import { streamArray } from 'stream-json/streamers/stream-array.js'
import { formatReportingDate } from '../utils/dates.js'
import {
  NO_MATCH_CSV,
  MANUAL_RELEASE_CSV,
  LEVEL_MATCHING_CSV,
  CUSTOMS_DECLARATIONS_CSV,
  IPAFFS_CHEDS_CSV,
  TRACES_CHEDS_CSV
} from '../routes/route-constants.js'

const headings = {
  [NO_MATCH_CSV]: 'No matches MRNs',
  [MANUAL_RELEASE_CSV]: 'Manual releases MRNs',
  [LEVEL_MATCHING_CSV]: 'Level No Matches MRNs',
  [CUSTOMS_DECLARATIONS_CSV]: 'Customs Declarations',
  [IPAFFS_CHEDS_CSV]: 'IPAFFS CHEDs',
  [TRACES_CHEDS_CSV]: 'TRACES CHEDs'
}

export const mapReportsCsv = (res, name, startDate, endDate, mapRowHandler, reportHeaders) => {
  const from = formatReportingDate(startDate)
  const to = formatReportingDate(endDate)

  let firstRow = true
  const pushHeader = (stream) => {
    stream.push(`BTMS - ${headings[name]}\n`)
    stream.push(`Date range: ${from} to ${to}\n`)
    stream.push('\n')
    stream.push(reportHeaders)
  }
  const toCsv = new Transform({
    writableObjectMode: true,
    transform({ value }, _, callback) {
      const row = mapRowHandler(value)

      if (firstRow) {
        pushHeader(this)
        firstRow = false
      }
      this.push(row)
      callback()
    },
    flush(callback) {
      if (firstRow) {
        pushHeader(this)
      }
      callback()
    }
  })

  return res
    .pipe(parser.asStream())
    .pipe(pick.asStream({ filter: 'data' }))
    .pipe(streamArray.asStream())
    .pipe(toCsv)
}
