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
    .setSystemTime(new Date('2025-09-23'))

  const noMatches = {
    data: [
      {
        timestamp: '2025-09-22T11:47:05.367Z',
        reference: '25GBO1LJH43YMZO0X5'
      },
      {
        timestamp: '2025-09-22T11:47:49.998Z',
        reference: '25GBO2FGE22YTRF2C4'
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
Date range: 22 September 2025 at 00:00 to 22 September 2025 at 23:59

MRN,Last updated
25GBO1LJH43YMZO0X5,"22 September 25, 11:47"
25GBO2FGE22YTRF2C4,"22 September 25, 11:47"
`)

  expect(headers['content-type']).toBe('text/csv; charset=utf-8')
  expect(headers['content-disposition']).toBe(
    'attachment; filename="no-matches-2025.09.22-2025.09.22.csv"'
  )
  expect(headers['cache-control']).toBe('no-store')

  const apiURL = wreck.request.mock.calls[0][1]
  const { pathname, searchParams } = new URL(apiURL)

  expect(pathname).toBe('/reporting-api/matches/data')
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-09-22T00:00:00.000Z',
    to: '2025-09-23T00:00:00.000Z',
    match: 'false'
  })
})

test('manual releases csv', async () => {
  jest
    .useFakeTimers({ doNotFake: ['nextTick'] })
    .setSystemTime(new Date('2025-09-23'))

  const noMatches = {
    data: [
      {
        timestamp: '2025-09-22T10:00:00.000Z',
        reference: '25GBO2YTP65OPRO1Y2'
      },
      {
        timestamp: '2025-09-22T11:00:00.000Z',
        reference: '25GBO2WER23TUYO4D3'
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
Date range: 22 September 2025 at 00:00 to 22 September 2025 at 23:59

MRN,Last updated
25GBO2YTP65OPRO1Y2,"22 September 25, 10:00"
25GBO2WER23TUYO4D3,"22 September 25, 11:00"
`)

  expect(headers['content-type']).toBe('text/csv; charset=utf-8')
  expect(headers['content-disposition']).toBe(
    'attachment; filename="manual-releases-2025.09.22-2025.09.22.csv"'
  )

  const apiURL = wreck.request.mock.calls[0][1]
  const { pathname, searchParams } = new URL(apiURL)

  expect(pathname).toBe('/reporting-api/releases/data')
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2025-09-22T00:00:00.000Z',
    to: '2025-09-23T00:00:00.000Z',
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
