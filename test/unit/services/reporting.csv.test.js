import wreck from '@hapi/wreck'
import { getReportingCsv } from '../../../src/services/reporting.csv.js'
import {
  CUSTOMS_DECLARATIONS_CSV,
  IPAFFS_CHEDS_CSV,
  LEVEL_MATCHING_CSV,
  MANUAL_RELEASE_CSV,
  NO_MATCH_CSV,
  TRACES_CHEDS_CSV
} from '../../../src/routes/route-constants.js'

jest.mock('@hapi/wreck', () => ({
  request: jest.fn()
}))

const startDate = new Date('2025-09-01T00:00:00.000Z')
const endDate = new Date('2025-09-01T23:59:59.999Z')

const getReport = (name) =>
  getReportingCsv({
    query: { startDate, endDate },
    params: { name },
    logger: { setBindings: jest.fn() }
  })

beforeEach(() => {
  wreck.request.mockResolvedValue({ statusCode: 200 })
})

test.each([
  [NO_MATCH_CSV, '/reporting-api/matches/data', { match: 'false' }],
  [MANUAL_RELEASE_CSV, '/reporting-api/releases/data', { releaseType: 'Manual' }],
  [LEVEL_MATCHING_CSV, '/reporting-api/matches/data', { match: 'false' }],
  [CUSTOMS_DECLARATIONS_CSV, '/reporting-api/extracts/customs-declarations', {}],
  [IPAFFS_CHEDS_CSV, '/reporting-api/extracts/ipaffs-cheds', {}],
  [TRACES_CHEDS_CSV, '/reporting-api/extracts/traces-cheds', {}]
])('requests the API path for %s', async (name, expectedPath, expectedParams) => {
  await getReport(name)

  const [, url] = wreck.request.mock.calls[0]
  const { pathname, searchParams } = new URL(url)

  expect(pathname).toBe(expectedPath)
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-09-01T00:00:00.000Z',
    to: '2025-09-02T00:00:00.000Z',
    ...expectedParams
  })
})
