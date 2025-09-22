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

afterEach(jest.useRealTimers)

test('reporting summary', async () => {
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

  const today = new URLSearchParams({
    startDate: '09/09/2025',
    endDate: '09/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Today'
    })
  ).toHaveAttribute('href', `/reporting?${today}`)

  const yesterday = new URLSearchParams({
    startDate: '08/09/2025',
    endDate: '08/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Yesterday'
    })
  ).toHaveAttribute('href', `/reporting?${yesterday}`)

  const lastWeek = new URLSearchParams({
    startDate: '03/09/2025',
    endDate: '09/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Last week'
    })
  ).toHaveAttribute('href', `/reporting?${lastWeek}`)

  const lastMonth = new URLSearchParams({
    startDate: '11/08/2025',
    endDate: '09/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Last month'
    })
  ).toHaveAttribute('href', `/reporting?${lastMonth}`)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Showing results from 8 September 2025 at 00:00 to 8 September 2025 at 23:59',
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
  expect(matchPercentage.textContent.trim()).toBe('(90%)')

  expect(noMatch.textContent.trim()).toBe('No matches')
  expect(noMatchTotal.textContent.trim()).toBe('20')
  expect(noMatchPercentage.textContent.trim()).toBe('(10%)')

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
  expect(uniquePercentage.textContent.trim()).toBe('(75%)')

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
  expect(chedAPercentage.textContent.trim()).toBe('(50%)')

  expect(chedP.textContent.trim()).toBe('CHED P')
  expect(chedPTotal.textContent.trim()).toBe('50')
  expect(chedPPercentage.textContent.trim()).toBe('(25%)')

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

test('today up to this minute', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-18:10:30'))

  const summary = {
    releases: {},
    matches: {},
    clearanceRequests: {},
    notifications: {}
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: summary })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const today = new URLSearchParams({
    startDate: '18/09/2025',
    endDate: '18/09/2025'
  })

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?${today}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Showing results from 18 September 2025 at 00:00 to 18 September 2025 at 10:30',
      level: 2
    })
  ).toBeInTheDocument()
})

test('empty date fields', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-18:13:00'))

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const emptyQuery = new URLSearchParams({
    startDate: '',
    endDate: ''
  })

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?${emptyQuery}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  const today = new URLSearchParams({
    startDate: '18/09/2025',
    endDate: '18/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Today'
    })
  ).toHaveAttribute('href', `/reporting?${today}`)

  const yesterday = new URLSearchParams({
    startDate: '17/09/2025',
    endDate: '17/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Yesterday'
    })
  ).toHaveAttribute('href', `/reporting?${yesterday}`)

  const lastWeek = new URLSearchParams({
    startDate: '12/09/2025',
    endDate: '18/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Last week'
    })
  ).toHaveAttribute('href', `/reporting?${lastWeek}`)

  const lastMonth = new URLSearchParams({
    startDate: '20/08/2025',
    endDate: '18/09/2025'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Last month'
    })
  ).toHaveAttribute('href', `/reporting?${lastMonth}`)

  expect(
    getByRole(document.body, 'heading', {
      name: 'There is a problem',
      level: 2
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'link', { name: 'Enter a start date' })
  ).toHaveAttribute('href', '#startDate')

  expect(
    getByRole(document.body, 'link', { name: 'Enter an end date' })
  ).toHaveAttribute('href', '#endDate')
})

test('invalid date range', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const invalidRangeQuery = new URLSearchParams({
    startDate: '18/09/2025',
    endDate: '17/09/2025'
  })

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?${invalidRangeQuery}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', {
      name: 'There is a problem',
      level: 2
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'link', {
      name: 'End date must be after or the same as start date'
    })
  ).toHaveAttribute('href', '#endDate')
})

test('endDate in the future', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-18'))

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const invalidDatesQuery = new URLSearchParams({
    startDate: '18/09/2025',
    endDate: '19/09/2026'
  })

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?${invalidDatesQuery}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', {
      name: 'There is a problem',
      level: 2
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'link', {
      name: 'End date must be today or in the past'
    })
  ).toHaveAttribute('href', '#endDate')
})

test('invalid dates', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const invalidDatesQuery = new URLSearchParams({
    startDate: 'foo',
    endDate: 'bar'
  })

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?${invalidDatesQuery}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', {
      name: 'There is a problem',
      level: 2
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'link', {
      name: 'Enter a valid start date'
    })
  ).toHaveAttribute('href', '#startDate')

  expect(
    getByRole(document.body, 'link', {
      name: 'Enter a valid end date'
    })
  ).toHaveAttribute('href', '#endDate')
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
