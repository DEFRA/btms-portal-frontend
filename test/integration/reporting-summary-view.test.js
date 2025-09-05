import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import * as reportingService from '../../src/services/reporting.js'

jest.mock('../../src/services/reporting.js')

beforeEach(() => {
  jest.clearAllMocks()
})

test('renders reporting summary view with API data', async () => {
  const mockSummary = {
    releases: {
      automatic: 25,
      automaticPercentage: 33.33,
      manual: 50,
      manualPercentage: 66.67,
      total: 75
    },
    matches: {
      match: 60,
      noMatch: 54,
      total: 114
    }
  }

  reportingService.getSummary.mockResolvedValue(mockSummary)

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.REPORTING_SUMMARY_VIEW,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  const automaticCard = document.querySelector('.btms-summary-releases-automatic')
  expect(automaticCard.textContent).toContain('25')
  expect(automaticCard.textContent).toContain('(33.33%)')

  const manualCard = document.querySelector('.btms-summary-releases-manual')
  expect(manualCard.textContent).toContain('50')
  expect(manualCard.textContent).toContain('(66.67%)')

  const totalCard = document.querySelector('.btms-summary-releases-total')
  expect(totalCard.textContent).toContain('75')
})

test('verifies date calculation works correctly', async () => {
  const mockSummary = {
    releases: { automatic: 5, manual: 10, total: 15 },
    matches: { match: 30, noMatch: 20, total: 50 }
  }

  reportingService.getSummary.mockResolvedValue(mockSummary)

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  await server.inject({
    method: 'get',
    url: paths.REPORTING_SUMMARY_VIEW,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  const [, from, to] = reportingService.getSummary.mock.calls[0]
  const fromDate = new Date(from)
  const toDate = new Date(to)
  
  expect(toDate.getTime() - fromDate.getTime()).toBe(24 * 60 * 60 * 1000)
  expect(from).toMatch(/T00:00:00\.000Z$/)
  expect(to).toMatch(/T00:00:00\.000Z$/)
})

test('handles API errors gracefully', async () => {
  reportingService.getSummary.mockRejectedValue(new Error('API Error'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.REPORTING_SUMMARY_VIEW,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(500)
})

test('redirect non authorised requests', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.REPORTING_SUMMARY_VIEW
  })

  expect(statusCode).toBe(302)
})
