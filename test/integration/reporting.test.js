import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import {
  createAuthedUser,
  setupAuthedAdminUserSession,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import {
  getByRole,
  getAllByRole,
  queryByRole,
  getByText
} from '@testing-library/dom'
import { format, subDays } from 'date-fns'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

afterEach(jest.useRealTimers)

test('reporting data', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-09'))

  const reportingData = {
    releases: {
      intervals: [
        {
          interval: '2025-09-07T23:00:00Z',
          summary: { automatic: 30, manual: 3, total: 33 }
        },
        {
          interval: '2025-09-08T05:00:00Z',
          summary: { automatic: 40, manual: 2, total: 42 }
        }
      ]
    },
    matches: {
      intervals: [
        {
          interval: '2025-09-07T23:00:00Z',
          summary: { match: 100, noMatch: 990, total: 1090 }
        },
        {
          interval: '2025-09-08T05:00:00Z',
          summary: { match: 80, noMatch: 10, total: 90 }
        }
      ]
    },
    clearanceRequests: {
      intervals: [
        {
          interval: '2025-09-07T23:00:00Z',
          summary: { unique: 50, total: 50 }
        },
        {
          interval: '2025-09-08T05:00:00Z',
          summary: { unique: 25, total: 50 }
        }
      ]
    },
    notifications: {
      intervals: [
        {
          interval: '2025-09-07T23:00:00Z',
          summary: {
            chedA: 50,
            chedP: 25,
            chedPp: 15,
            chedD: 20,
            total: 110
          }
        },
        {
          interval: '2025-09-08T05:00:00Z',
          summary: {
            chedA: 50,
            chedP: 25,
            chedPp: 10,
            chedD: 5,
            total: 90
          }
        }
      ]
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: reportingData })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}?tab=summary-view`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  const today = new URLSearchParams({
    startDate: '09/09/2025',
    endDate: '09/09/2025',
    tab: 'summary-view'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Today'
    })
  ).toHaveAttribute('href', `/reporting?${today}`)

  const yesterday = new URLSearchParams({
    startDate: '08/09/2025',
    endDate: '08/09/2025',
    tab: 'summary-view'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Yesterday'
    })
  ).toHaveAttribute('href', `/reporting?${yesterday}`)

  const lastWeek = new URLSearchParams({
    startDate: '03/09/2025',
    endDate: '09/09/2025',
    tab: 'summary-view'
  })
  expect(
    getByRole(document.body, 'link', {
      name: 'Last week'
    })
  ).toHaveAttribute('href', `/reporting?${lastWeek}`)

  const lastMonth = new URLSearchParams({
    startDate: '11/08/2025',
    endDate: '09/09/2025',
    tab: 'summary-view'
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

  const datePickers = document.body.querySelectorAll(
    '[data-module="moj-date-picker"]'
  )
  expect(datePickers.length).toBe(2)
  const minDate = format(subDays(new Date(), 122), 'dd/MM/yyyy')
  const startDateMin = datePickers[0].getAttribute('data-min-date')
  const endDateMin = datePickers[1].getAttribute('data-min-date')
  expect(startDateMin).toBe(minDate)
  expect(endDateMin).toBe(minDate)

  const [matchesSummaryRegion] = getAllByRole(document.body, 'region', {
    name: 'Matches'
  })
  expect(getByRole(matchesSummaryRegion, 'paragraph')).toBeInTheDocument()

  const [match, noMatch, matches] = getAllByRole(matchesSummaryRegion, 'term')
  const [
    matchTotal,
    matchPercentage,
    noMatchTotal,
    noMatchPercentage,
    matchesTotal
  ] = getAllByRole(matchesSummaryRegion, 'definition')

  expect(match.textContent.trim()).toBe('Matches')
  expect(matchTotal.textContent.trim()).toBe('180')
  expect(matchPercentage.textContent.trim()).toBe('(15.25%)')

  expect(noMatch.textContent.trim()).toBe('No matches')
  expect(noMatchTotal.textContent.trim()).toBe('1,000')
  expect(noMatchPercentage.textContent.trim()).toBe('(84.75%)')

  expect(matches.textContent.trim()).toBe('Total')
  expect(matchesTotal.textContent.trim()).toBe('1,180')

  const [releasesSummaryRegion] = getAllByRole(document.body, 'region', {
    name: 'Releases'
  })

  const [auto, manual, releases] = getAllByRole(releasesSummaryRegion, 'term')
  const [
    autoTotal,
    autoPercentage,
    manualTotal,
    manualPercentage,
    releasesTotal
  ] = getAllByRole(releasesSummaryRegion, 'definition')

  expect(auto.textContent.trim()).toBe('Automatic')
  expect(autoTotal.textContent.trim()).toBe('70')
  expect(autoPercentage.textContent.trim()).toBe('(93.33%)')

  expect(manual.textContent.trim()).toBe('Manual')
  expect(manualTotal.textContent.trim()).toBe('5')
  expect(manualPercentage.textContent.trim()).toBe('(6.67%)')

  expect(releases.textContent.trim()).toBe('Total')
  expect(releasesTotal.textContent.trim()).toBe('75')

  const [requestsSummaryRegion] = getAllByRole(document.body, 'region', {
    name: 'Unique clearance requests'
  })
  expect(getByRole(requestsSummaryRegion, 'paragraph')).toBeInTheDocument()

  const [unique, requests] = getAllByRole(requestsSummaryRegion, 'term')
  const [uniqueTotal, uniquePercentage, requestsTotal] = getAllByRole(
    requestsSummaryRegion,
    'definition'
  )

  expect(unique.textContent.trim()).toBe('Unique clearances')
  expect(uniqueTotal.textContent.trim()).toBe('75')
  expect(uniquePercentage.textContent.trim()).toBe('(75%)')

  expect(requests.textContent.trim()).toBe('Total')
  expect(requestsTotal.textContent.trim()).toBe('100')

  const [chedsSummaryRegion] = getAllByRole(document.body, 'region', {
    name: 'Pre-notifications by CHED type'
  })

  const [chedA, chedP, chedPp, chedD, cheds] = getAllByRole(
    chedsSummaryRegion,
    'term'
  )
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
  ] = getAllByRole(chedsSummaryRegion, 'definition')

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
  expect(searchParams.get('from')).toBe('2025-09-08T00:00:00.000Z')
  expect(searchParams.get('to')).toBe('2025-09-09T00:00:00.000Z')
  expect(searchParams.getAll('intervals')).toEqual([
    '2025-09-08T01:00:00.000Z',
    '2025-09-08T02:00:00.000Z',
    '2025-09-08T03:00:00.000Z',
    '2025-09-08T04:00:00.000Z',
    '2025-09-08T05:00:00.000Z',
    '2025-09-08T06:00:00.000Z',
    '2025-09-08T07:00:00.000Z',
    '2025-09-08T08:00:00.000Z',
    '2025-09-08T09:00:00.000Z',
    '2025-09-08T10:00:00.000Z',
    '2025-09-08T11:00:00.000Z',
    '2025-09-08T12:00:00.000Z',
    '2025-09-08T13:00:00.000Z',
    '2025-09-08T14:00:00.000Z',
    '2025-09-08T15:00:00.000Z',
    '2025-09-08T16:00:00.000Z',
    '2025-09-08T17:00:00.000Z',
    '2025-09-08T18:00:00.000Z',
    '2025-09-08T19:00:00.000Z',
    '2025-09-08T20:00:00.000Z',
    '2025-09-08T21:00:00.000Z',
    '2025-09-08T22:00:00.000Z',
    '2025-09-08T23:00:00.000Z',
    '2025-09-09T00:00:00.000Z'
  ])

  expect(document.title).toBe(
    'BTMS reporting data - Border Trade Matching Service'
  )

  const [noMatchesLink, manualReleasesLink] = getAllByRole(
    document.body,
    'link',
    {
      name: 'Download CSV'
    }
  )
  const csvQuery = new URLSearchParams({
    startDate: '8/9/2025',
    endDate: '8/9/2025'
  })
  expect(noMatchesLink).toHaveAttribute(
    'href',
    `/reporting/no-matches.csv?${csvQuery}`
  )
  expect(manualReleasesLink).toHaveAttribute(
    'href',
    `/reporting/manual-releases.csv?${csvQuery}`
  )
})

test('today up to this minute', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-18:10:30'))

  const reportingData = {
    releases: { intervals: [] },
    matches: { intervals: [] },
    clearanceRequests: { intervals: [] },
    notifications: { intervals: [] }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: reportingData })

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

test.each([
    {
      scope: ['admin'],
      levelMatchingTabAllowed: true
    },
    {
      scope: [],
      levelMatchingTabAllowed: false
    }
])('Level Matching Tab is only visible for allowed user', async (user) => {
  const levelMatchingByRegionData = {
    total: 1000,
    eu: {
      total: 780,
      match: {
        total: 750,
        level1: 750,
        level2: 712,
        level3: 625
      },
      noMatch: {
        total: 30,
        level1: 30,
        level2: 58,
        level3: 81
      }
    },
    row: {
      total: 220,
      match: {
        total: 200,
        level1: 200,
        level2: 191,
        level3: 240
      },
      noMatch: {
        total: 20,
        level1: 20,
        level2: 39,
        level3: 54
      }
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: {} })

  if (user.levelMatchingTabAllowed) {
    wreck.get.mockResolvedValueOnce({ payload: levelMatchingByRegionData })
  }

  const server = await initialiseServer()
  const authedUser = createAuthedUser(undefined, 'entraId')
  authedUser.scope = user.scope

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}#level-matching-view`,
    auth: {
      strategy: 'session',
      credentials: {
        ...authedUser
      }
    }
  })

  globalJsdom(payload)

  if (user.levelMatchingTabAllowed) {
    expect(
      getByRole(document.body, 'link', {
        name: 'L1, L2 & L3 matching'
      })).toBeInTheDocument()
  } else {
    expect(
      queryByRole(document.body, 'link', {
        name: 'L1, L2 & L3 matching'
      })).not.toBeInTheDocument()
  }
})

test('logged in user is redirected if not authorised to get level matching report CSV', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/restricted-reporting/level-matching.csv',
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(403)
  expect(
    getByText(document.body, 'You do not have the correct permissions to access this service')
  ).toBeInTheDocument()
})

test('user with no logged in session is redirected to sign in if attempting to get level matching report CSV', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: '/restricted-reporting/level-matching.csv'
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/sign-in-choose')
})

test('match rate figures are shown for all levels when viewed by authorized user', async () => {
  const levelMatchingByRegionData = {
    total: 1000,
    eu: {
      total: 780,
      match: {
        total: 750,
        level1: 750,
        level2: 712,
        level3: 625
      },
      noMatch: {
        total: 30,
        level1: 30,
        level2: 58,
        level3: 81
      }
    },
    row: {
      total: 220,
      match: {
        total: 200,
        level1: 200,
        level2: 191,
        level3: 240
      },
      noMatch: {
        total: 20,
        level1: 20,
        level2: 39,
        level3: 54
      }
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: {} })
    .mockResolvedValueOnce({ payload: levelMatchingByRegionData })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}#level-matching-view`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'button', { name: 'Download as CSV' })).toBeInTheDocument()
  expect(getByText(document.body, 'This data is only available from 15th May 2026.')).toBeInTheDocument()

  const level1MatchRateSection = document.body.querySelector('[aria-labelledby="level1-summary-heading"]')
  expect(level1MatchRateSection).toBeInTheDocument()
  const level1Figures = level1MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level1Figures.length).toBe(9)
  expect(level1Figures[0].textContent).toBe("950") // Level 1 Matches
  expect(level1Figures[1].textContent).toBe("50") // Level 1 No Matches
  expect(level1Figures[2].textContent).toBe("1,000") // Level 1 Total
  expect(level1Figures[3].textContent).toBe("750") // Level 1 EU Matches
  expect(level1Figures[4].textContent).toBe("200") // Level 1 RoW Matches
  expect(level1Figures[5].textContent).toBe("950") // Level 1 EU/RoW Matches Total
  expect(level1Figures[6].textContent).toBe("30") // Level 1 EU No Matches
  expect(level1Figures[7].textContent).toBe("20") // Level 1 RoW No Matches
  expect(level1Figures[8].textContent).toBe("50") // Level 1 EU/RoW No Matches Total
  const level1Percentages = level1MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level1Percentages.length).toBe(6)
  expect(level1Percentages[0].textContent).toBe("(95%)")
  expect(level1Percentages[1].textContent).toBe("(5%)")
  expect(level1Percentages[2].textContent).toBe("(75%)")
  expect(level1Percentages[3].textContent).toBe("(20%)")
  expect(level1Percentages[4].textContent).toBe("(3%)")
  expect(level1Percentages[5].textContent).toBe("(2%)")

  const level2MatchRateSection = document.body.querySelector('[aria-labelledby="level2-summary-heading"]')
  const level2Figures = level2MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level2Figures.length).toBe(9)
  expect(level2Figures[0].textContent).toBe("903")
  expect(level2Figures[1].textContent).toBe("97")
  expect(level2Figures[2].textContent).toBe("1,000")
  expect(level2Figures[3].textContent).toBe("712")
  expect(level2Figures[4].textContent).toBe("191")
  expect(level2Figures[5].textContent).toBe("903")
  expect(level2Figures[6].textContent).toBe("58")
  expect(level2Figures[7].textContent).toBe("39")
  expect(level2Figures[8].textContent).toBe("97")
  const level2Percentages = level2MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level2Percentages.length).toBe(6)
  expect(level2Percentages[0].textContent).toBe("(90.30%)")
  expect(level2Percentages[1].textContent).toBe("(9.70%)")
  expect(level2Percentages[2].textContent).toBe("(71.20%)")
  expect(level2Percentages[3].textContent).toBe("(19.10%)")
  expect(level2Percentages[4].textContent).toBe("(5.80%)")
  expect(level2Percentages[5].textContent).toBe("(3.90%)")

  const level3MatchRateSection = document.body.querySelector('[aria-labelledby="level3-summary-heading"]')
  const level3Figures = level3MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level3Figures.length).toBe(9)
  expect(level3Figures[0].textContent).toBe("865")
  expect(level3Figures[1].textContent).toBe("135")
  expect(level3Figures[2].textContent).toBe("1,000")
  expect(level3Figures[3].textContent).toBe("625")
  expect(level3Figures[4].textContent).toBe("240")
  expect(level3Figures[5].textContent).toBe("865")
  expect(level3Figures[6].textContent).toBe("81")
  expect(level3Figures[7].textContent).toBe("54")
  expect(level3Figures[8].textContent).toBe("135")
  const level3Percentages = level3MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level3Percentages.length).toBe(6)
  expect(level3Percentages[0].textContent).toBe("(86.50%)")
  expect(level3Percentages[1].textContent).toBe("(13.50%)")
  expect(level3Percentages[2].textContent).toBe("(62.50%)")
  expect(level3Percentages[3].textContent).toBe("(24%)")
  expect(level3Percentages[4].textContent).toBe("(8.10%)")
  expect(level3Percentages[5].textContent).toBe("(5.40%)")

  const regionSplitDetailsSections = Array.from(document.body.querySelectorAll('.btms-level-region-split__details'))
  expect(regionSplitDetailsSections.length).toBe(3)
  expect(regionSplitDetailsSections.every(detailSection => !detailSection.hasAttribute('open'))).toBeTruthy()
})

test('handles upstream errors in the level matches API', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: {} })
    .mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

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

test('handles request for restricted report that does not exist', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/restricted-reporting/foo.csv',
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(404)
  getByRole(document.body, 'heading', {
    name: 'Page not found'
  })
  expect(document.title).toBe('Page not found - Border Trade Matching Service')
})

test('handles request for restricted report with invalid params', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/restricted-reporting/level-matching.csv?startDate=&amp;endDate=',
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(400)
  getByRole(document.body, 'heading', {
    name: 'Sorry, there is a problem with this service'
  })
})

test.each([
  {
    euLevel1Match: 1,
    euLevel1NoMatch: 1,
    rowLevel1Match: 1,
    rowLevel1NoMatch: 1,
    euLevel2Match: 1,
    euLevel2NoMatch: 1,
    rowLevel2Match: 1,
    rowLevel2NoMatch: 1,
    euLevel3Match: 1,
    euLevel3NoMatch: 1,
    rowLevel3Match: 1,
    rowLevel3NoMatch: 1,
    total: 'FOO',
    expectedTotal: '0'
  },
  {
    euLevel1Match: 'FOO',
    euLevel1NoMatch: 'FOO',
    rowLevel1Match: 'FOO',
    rowLevel1NoMatch: 'FOO',
    euLevel2Match: 'FOO',
    euLevel2NoMatch: 'FOO',
    rowLevel2Match: 'FOO',
    rowLevel2NoMatch: 'FOO',
    euLevel3Match: 'FOO',
    euLevel3NoMatch: 'FOO',
    rowLevel3Match: 'FOO',
    rowLevel3NoMatch: 'FOO',
    total: 1,
    expectedTotal: '1'
  }
])('handles level matching figures that are invalid', async (options) => {
  const levelMatchingByRegionData = {
    total: options.total,
    eu: {
      total: options.total,
      match: {
        total: options.total,
        level1: options.euLevel1Match,
        level2: options.euLevel2Match,
        level3: options.euLevel3Match
      },
      noMatch: {
        total: options.total,
        level1: options.euLevel1NoMatch,
        level2: options.euLevel2NoMatch,
        level3: options.euLevel3NoMatch
      }
    },
    row: {
      total: options.total,
      match: {
        total: options.total,
        level1: options.rowLevel1Match,
        level2: options.rowLevel2Match,
        level3: options.rowLevel2Match
      },
      noMatch: {
        total: options.total,
        level1: options.rowLevel1NoMatch,
        level2: options.rowLevel2NoMatch,
        level3: options.rowLevel3NoMatch
      }
    }
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: {} })
  .mockResolvedValueOnce({ payload: levelMatchingByRegionData })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING}#level-matching-view`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'button', { name: 'Download as CSV' })).toBeInTheDocument()
  expect(getByText(document.body, 'This data is only available from 15th May 2026.')).toBeInTheDocument()

  const level1MatchRateSection = document.body.querySelector('[aria-labelledby="level1-summary-heading"]')
  expect(level1MatchRateSection).toBeInTheDocument()
  const level1MatchesFigure = level1MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level1MatchesFigure.length).toBe(9)
  expect(level1MatchesFigure[0].textContent).toBe("0")
  expect(level1MatchesFigure[1].textContent).toBe("0")
  expect(level1MatchesFigure[2].textContent).toBe(options.expectedTotal)
  expect(level1MatchesFigure[3].textContent).toBe("0")
  expect(level1MatchesFigure[4].textContent).toBe("0")
  expect(level1MatchesFigure[5].textContent).toBe("0")
  expect(level1MatchesFigure[6].textContent).toBe("0")
  expect(level1MatchesFigure[7].textContent).toBe("0")
  expect(level1MatchesFigure[8].textContent).toBe("0")
  const level1Percentages = level1MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level1Percentages.length).toBe(6)
  expect(level1Percentages[0].textContent).toBe("(0%)")
  expect(level1Percentages[1].textContent).toBe("(0%)")
  expect(level1Percentages[2].textContent).toBe("(0%)")
  expect(level1Percentages[3].textContent).toBe("(0%)")
  expect(level1Percentages[4].textContent).toBe("(0%)")
  expect(level1Percentages[5].textContent).toBe("(0%)")

  const level2MatchRateSection = document.body.querySelector('[aria-labelledby="level2-summary-heading"]')
  const level2MatchesFigure = level2MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level2MatchesFigure.length).toBe(9)
  expect(level2MatchesFigure[0].textContent).toBe("0")
  expect(level2MatchesFigure[1].textContent).toBe("0")
  expect(level2MatchesFigure[2].textContent).toBe(options.expectedTotal)
  expect(level2MatchesFigure[3].textContent).toBe("0")
  expect(level2MatchesFigure[4].textContent).toBe("0")
  expect(level2MatchesFigure[5].textContent).toBe("0")
  expect(level2MatchesFigure[6].textContent).toBe("0")
  expect(level2MatchesFigure[7].textContent).toBe("0")
  expect(level2MatchesFigure[8].textContent).toBe("0")
  const level2Percentages = level2MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level2Percentages.length).toBe(6)
  expect(level2Percentages[0].textContent).toBe("(0%)")
  expect(level2Percentages[1].textContent).toBe("(0%)")
  expect(level2Percentages[2].textContent).toBe("(0%)")
  expect(level2Percentages[3].textContent).toBe("(0%)")
  expect(level2Percentages[4].textContent).toBe("(0%)")
  expect(level2Percentages[5].textContent).toBe("(0%)")

  const level3MatchRateSection = document.body.querySelector('[aria-labelledby="level3-summary-heading"]')
  const level3MatchesFigure = level3MatchRateSection.querySelectorAll('dd.govuk-heading-l')
  expect(level3MatchesFigure.length).toBe(9)
  expect(level3MatchesFigure[0].textContent).toBe("0")
  expect(level3MatchesFigure[1].textContent).toBe("0")
  expect(level3MatchesFigure[2].textContent).toBe(options.expectedTotal)
  expect(level3MatchesFigure[3].textContent).toBe("0")
  expect(level3MatchesFigure[4].textContent).toBe("0")
  expect(level3MatchesFigure[5].textContent).toBe("0")
  expect(level3MatchesFigure[6].textContent).toBe("0")
  expect(level3MatchesFigure[7].textContent).toBe("0")
  expect(level3MatchesFigure[8].textContent).toBe("0")
  const level3Percentages = level3MatchRateSection.querySelectorAll('dd.btms-percentage')
  expect(level3Percentages.length).toBe(6)
  expect(level3Percentages[0].textContent).toBe("(0%)")
  expect(level3Percentages[1].textContent).toBe("(0%)")
  expect(level3Percentages[2].textContent).toBe("(0%)")
  expect(level3Percentages[3].textContent).toBe("(0%)")
  expect(level3Percentages[4].textContent).toBe("(0%)")
  expect(level3Percentages[5].textContent).toBe("(0%)")
})
