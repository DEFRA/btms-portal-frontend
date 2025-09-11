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
      automatic: 70,
      manual: 5,
      total: 75
    },
    matches: {
      match: 180,
      noMatch: 20,
      total: 200
    },
    clearanceRequests: {
      unique: 75,
      total: 100
    },
    notifications: {
      chedA: 100,
      chedP: 50,
      chedPp: 25,
      chedD: 25,
      total: 200
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

  const matchesRegion = getByRole(document.body, 'region', { name: 'Matches' })
  expect(getByRole(matchesRegion, 'paragraph')).toBeInTheDocument()

  const [match, noMatch, matches] = getAllByRole(matchesRegion, 'term')
  const [
    matchTotal,
    matchPercentage,
    noMatchTotal,
    noMatchPercentage,
    matchesTotal
  ] = getAllByRole(matchesRegion, 'definition')

  expect(match.textContent.trim()).toBe('Matches')
  expect(matchTotal.textContent.trim()).toBe('180')
  expect(matchPercentage.textContent.trim()).toBe('(90.00%)')

  expect(noMatch.textContent.trim()).toBe('No matches')
  expect(noMatchTotal.textContent.trim()).toBe('20')
  expect(noMatchPercentage.textContent.trim()).toBe('(10.00%)')

  expect(matches.textContent.trim()).toBe('Total')
  expect(matchesTotal.textContent.trim()).toBe('200')

  const releasesRegion = getByRole(document.body, 'region', {
    name: 'Releases'
  })

  const [auto, manual, releases] = getAllByRole(releasesRegion, 'term')
  const [
    autoTotal,
    autoPercentage,
    manualTotal,
    manualPercentage,
    releasesTotal
  ] = getAllByRole(releasesRegion, 'definition')

  expect(auto.textContent.trim()).toBe('Auto')
  expect(autoTotal.textContent.trim()).toBe('70')
  expect(autoPercentage.textContent.trim()).toBe('(93.33%)')

  expect(manual.textContent.trim()).toBe('Manual')
  expect(manualTotal.textContent.trim()).toBe('5')
  expect(manualPercentage.textContent.trim()).toBe('(6.67%)')

  expect(releases.textContent.trim()).toBe('Total')
  expect(releasesTotal.textContent.trim()).toBe('75')

  const requestsRegion = getByRole(document.body, 'region', {
    name: 'Unique clearance requests'
  })
  expect(getByRole(requestsRegion, 'paragraph')).toBeInTheDocument()

  const [unique, requests] = getAllByRole(requestsRegion, 'term')
  const [uniqueTotal, uniquePercentage, requestsTotal] = getAllByRole(
    requestsRegion,
    'definition'
  )

  expect(unique.textContent.trim()).toBe('Unique clearances')
  expect(uniqueTotal.textContent.trim()).toBe('75')
  expect(uniquePercentage.textContent.trim()).toBe('(75.00%)')

  expect(requests.textContent.trim()).toBe('Total')
  expect(requestsTotal.textContent.trim()).toBe('100')

  const chedsRegion = getByRole(document.body, 'region', {
    name: 'Pre-notifications by CHED type'
  })

  const [chedA, chedP, chedPp, chedD, cheds] = getAllByRole(chedsRegion, 'term')
  const [
    chedATotal,
    chedAPercentage,
    chedPTotal,
    chedPPercentage,
    chedPpTotal,
    chedPpPercentage,
    chedDTotal,
    chedDPercentage,
    chedsTotal
  ] = getAllByRole(chedsRegion, 'definition')

  expect(chedA.textContent.trim()).toBe('CHED A')
  expect(chedATotal.textContent.trim()).toBe('100')
  expect(chedAPercentage.textContent.trim()).toBe('(50.00%)')

  expect(chedP.textContent.trim()).toBe('CHED P')
  expect(chedPTotal.textContent.trim()).toBe('50')
  expect(chedPPercentage.textContent.trim()).toBe('(25.00%)')

  expect(chedPp.textContent.trim()).toBe('CHED PP')
  expect(chedPpTotal.textContent.trim()).toBe('25')
  expect(chedPpPercentage.textContent.trim()).toBe('(12.50%)')

  expect(chedD.textContent.trim()).toBe('CHED D')
  expect(chedDTotal.textContent.trim()).toBe('25')
  expect(chedDPercentage.textContent.trim()).toBe('(12.50%)')

  expect(cheds.textContent.trim()).toBe('Total')
  expect(chedsTotal.textContent.trim()).toBe('200')

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
