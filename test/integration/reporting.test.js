import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { getByRole, getAllByRole } from '@testing-library/dom'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('renders reporting summary', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-09'))

  const summary = {
    releases: {
      automatic: 25,
      manual: 50,
      total: 75
    },
    matches: {
      match: 60,
      noMatch: 54,
      total: 114
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: summary })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.REPORTING,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Showing results from yesterday for all ports',
      level: 2
    })
  ).toBeInTheDocument()

  const [auto, manual, releases] = getAllByRole(document.body, 'term')
  const [
    autoTotal,
    autoPercentage,
    manualTotal,
    manualPercentage,
    releasesTotal
  ] = getAllByRole(document.body, 'definition')

  expect(auto.textContent.trim()).toBe('Auto')
  expect(autoTotal.textContent.trim()).toBe('25')
  expect(autoPercentage.textContent.trim()).toBe('(33.33%)')

  expect(manual.textContent.trim()).toBe('Manual')
  expect(manualTotal.textContent.trim()).toBe('50')
  expect(manualPercentage.textContent.trim()).toBe('(66.67%)')

  expect(releases.textContent.trim()).toBe('Total')
  expect(releasesTotal.textContent.trim()).toBe('75')

  const [apiURL] = wreck.get.mock.calls[2]

  const { searchParams } = new URL(apiURL)

  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-09-08T00:00:00.000Z',
    to: '2025-09-09T00:00:00.000Z'
  })

  expect(document.title).toBe(
    'BTMS reporting data - Border Trade Matching Service'
  )
})

test('handles upstream errors', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.REPORTING,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Sorry, there is a problem with this service'
    })
  ).toBeInTheDocument()
})

test('redirect non authorised requests', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: paths.REPORTING
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/sign-in-choose')
})
