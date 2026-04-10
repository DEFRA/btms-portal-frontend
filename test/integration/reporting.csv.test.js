import wreck from '@hapi/wreck'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'
import { dataStream } from '../utils/data-stream.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { getByRole } from '@testing-library/dom'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn(),
  request: jest.fn()
}))

test('no matches csv', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-10-22'))

  const noMatches = {
    data: [
      {
        timestamp: '2025-10-21T08:23:00.000Z',
        mrn: '25GBBM2H1R3H662AR3',
        itemNumber: 1,
        commodityCode: '0804400010',
        description: 'EDIBLE FRUIT AND NUTS; PEEL OF CITRUS FRUIT OR MELONS DATES, FIGS, PINEAPPLES, AVOCADOS, GUAVAS, MANGOES AND MANGOSTEENS, FRESH OR DRIED AVOCADOS FRESH',
        quantityOrWeight: 24000,
        chedReference: 'GBCHD2025',
        match: 'No',
        authority: 'PHSI',
        checkCode: 'H218',
        decision: 'No match',
        decisionReasons: 'CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.'
      },
      {
        timestamp: '2025-10-21T08:23:00.000Z',
        mrn: '25GBBM2H1R3H662AR3',
        itemNumber: 2,
        commodityCode: '0804400010',
        description: 'SOME FRUITS',
        quantityOrWeight: 100,
        chedReference: 'GBCHD2025',
        match: 'No',
        authority: 'PHSI',
        checkCode: 'H218',
        decision: 'No match',
        decisionReasons: 'CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.'
      }
    ]
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  wreck.request.mockResolvedValueOnce(dataStream(noMatches))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { headers, payload } = await server.inject({
    method: 'get',
    url: paths.REPORTING_CSV.replace('{name}', 'no-matches.csv'),
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(payload).toBe(`BTMS - No matches MRNs
Date range: 21 October 2025 at 00:00 to 21 October 2025 at 23:59

Last updated,MRN,Item number,Commodity code,Description,Quantity/Weight,CHED reference,Check code,Match,Authority,Decision,Decision reason
"21 October 25, 08:23",25GBBM2H1R3H662AR3,1,0804400010,EDIBLE FRUIT AND NUTS; PEEL OF CITRUS FRUIT OR MELONS DATES, FIGS, PINEAPPLES, AVOCADOS, GUAVAS, MANGOES AND MANGOSTEENS, FRESH OR DRIED AVOCADOS FRESH,24000,GBCHD2025,H218,No,PHSI,No match,CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.
"21 October 25, 08:23",25GBBM2H1R3H662AR3,2,0804400010,SOME FRUITS,100,GBCHD2025,H218,No,PHSI,No match,CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.
`)

  expect(headers['content-type']).toBe('text/csv; charset=utf-8')
  expect(headers['content-disposition']).toBe(
    'attachment; filename="no-matches-2025.10.21-2025.10.21.csv"'
  )
  expect(headers['cache-control']).toBe('no-store')

  const apiURL = wreck.request.mock.calls[0][1]
  const { pathname, searchParams } = new URL(apiURL)

  expect(pathname).toBe('/reporting-api/matches/data')
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-10-21T00:00:00.000Z',
    to: '2025-10-22T00:00:00.000Z',
    match: 'false'
  })
})

test('manual releases csv', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-10-22'))

  const noMatches = {
    data: [
      {
        timestamp: '2025-10-21T08:23:00.000Z',
        mrn: '25GBBM2H1R3H662AR4',
        itemNumber: 1,
        commodityCode: '0804400010',
        description: 'BEANS',
        quantityOrWeight: 24000,
        chedReference: 'GBCHD2025',
        match: 'No',
        authority: 'PHSI',
        checkCode: 'H218',
        decision: 'No match',
        decisionReasons: 'CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.'
      },
      {
        timestamp: '2025-10-21T08:23:00.000Z',
        mrn: '25GBBM2H1R3H662AR4',
        itemNumber: 2,
        commodityCode: '0804400010',
        description: 'HORSE FOOD',
        quantityOrWeight: 100,
        chedReference: 'GBCHD2025',
        match: 'No',
        authority: 'PHSI',
        checkCode: 'H218',
        decision: 'No match',
        decisionReasons: 'CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.'
      }
    ]
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  wreck.request.mockResolvedValueOnce(dataStream(noMatches))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { headers, payload } = await server.inject({
    method: 'get',
    url: paths.REPORTING_CSV.replace('{name}', 'manual-releases.csv'),
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(payload).toBe(`BTMS - Manual releases MRNs
Date range: 21 October 2025 at 00:00 to 21 October 2025 at 23:59

Last updated,MRN,Item number,Commodity code,Description,Quantity/Weight,CHED reference,Check code,Match,Authority,Decision,Decision reason
"21 October 25, 08:23",25GBBM2H1R3H662AR4,1,0804400010,BEANS,24000,GBCHD2025,H218,No,PHSI,No match,CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.
"21 October 25, 08:23",25GBBM2H1R3H662AR4,2,0804400010,HORSE FOOD,100,GBCHD2025,H218,No,PHSI,No match,CHED reference GBCHD2025. cannot be found in IPAFFS. Check that the reference is correct.
`)

  expect(headers['content-type']).toBe('text/csv; charset=utf-8')
  expect(headers['content-disposition']).toBe(
    'attachment; filename="manual-releases-2025.10.21-2025.10.21.csv"'
  )

  const apiURL = wreck.request.mock.calls[0][1]
  const { pathname, searchParams } = new URL(apiURL)

  expect(pathname).toBe('/reporting-api/releases/data')
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-10-21T00:00:00.000Z',
    to: '2025-10-22T00:00:00.000Z',
    releaseType: 'Manual'
  })
})

test('handles upstream errors', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  wreck.request.mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.REPORTING_CSV.replace('{name}', 'manual-releases.csv'),
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Sorry, there is a problem with this service',
      level: 1
    })
  ).toBeInTheDocument()
})

test('unrecognised params', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.REPORTING_CSV.replace('{name}', 'not-available.csv'),
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(404)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Page not found',
      level: 1
    })
  ).toBeInTheDocument()
})

test('invalid query', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const invalidDatesQuery = new URLSearchParams({
    startDate: 'foo',
    endDate: 'bar'
  })

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.REPORTING_CSV.replace(
      '{name}',
      'manual-releases.csv'
    )}?${invalidDatesQuery}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(400)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Sorry, there is a problem with this service',
      level: 1
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
    url: paths.REPORTING_CSV.replace('{name}', 'manual-releases.csv')
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/sign-in-choose')
})
