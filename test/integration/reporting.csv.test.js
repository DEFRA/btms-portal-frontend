import wreck from '@hapi/wreck'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'
import { dataStream } from '../utils/data-stream.js'
import {
  setupAuthedAdminUserSession,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'
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

test('higher level matching data csv', async () => {
  jest
  .useFakeTimers({ doNotFake: ['nextTick'] })
  .setSystemTime(new Date('2026-06-23'))

  const apiPayload = {
    "data": [
      {
        "timestamp": "2026-06-22T13:39:54.573Z",
        "mrn": "24GBBGBKCDMS135030",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO 24GBBGBKCDMS135030",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1013501",
        "match": "Yes",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "H01",
        "decisionReasons": null,
        "level": 1,
        "mode": "Active",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "IT"
      },
      {
        "timestamp": "2026-06-22T13:39:54.573Z",
        "mrn": "24GBBGBKCDMS135030",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO 24GBBGBKCDMS135030",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1013501",
        "match": "No",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "X00",
        "decisionReasons": null,
        "level": 2,
        "mode": "Passive",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "IT"
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128014",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112814",
        "match": "Yes",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "C06",
        "decisionReasons": null,
        "level": 1,
        "mode": "Active",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "IT"
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128014",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112814",
        "match": "No",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "X00",
        "decisionReasons": null,
        "level": 2,
        "mode": "Passive",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "IT"
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128015",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112815",
        "match": "Yes",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "C06",
        "decisionReasons": null,
        "level": 1,
        "mode": "Active",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "CA"
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128015",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112815",
        "match": "No",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "X00",
        "decisionReasons": null,
        "level": 2,
        "mode": "Passive",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": "CA"
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128016",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112816",
        "match": "Yes",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "C06",
        "decisionReasons": null,
        "level": 1,
        "mode": "Active",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": null
      },
      {
        "timestamp": "2026-06-22T13:38:34.257Z",
        "mrn": "24GBBGBKCDMA128016",
        "itemNumber": 1,
        "commodityCode": "1601009105",
        "description": "SALSICCIA PURO SUINO",
        "quantityOrWeight": 100,
        "chedReference": "CHEDA.GB.2025.1112816",
        "match": "No",
        "authority": "AHVLA",
        "checkCode": "H221",
        "decision": "X00",
        "decisionReasons": null,
        "level": 2,
        "mode": "Passive",
        "declarantId": "GB269573944000",
        "dispatchCountryCode": null
      }
    ]
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.request.mockResolvedValueOnce(dataStream(apiPayload))

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { headers, payload } = await server.inject({
    method: 'get',
    url: paths.RESTRICTED_REPORTING_CSV.replace('{name}', 'level-matching.csv'),
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(payload).toBe(`BTMS - Level No Matches MRNs
Date range: 22 June 2026 at 00:00 to 22 June 2026 at 23:59

Level,Last updated,MRN,Item number,Commodity code,Check code,Description,Quantity/Weight,CHED reference,Match,Authority,Decision,Decision reason,EORI Number,Country Code,Country Region (EU or RoW)
1,"22 June 26, 13:39",24GBBGBKCDMS135030,1,1601009105,H221,"SALSICCIA PURO SUINO 24GBBGBKCDMS135030",100,CHEDA.GB.2025.1013501,Yes,AHVLA,H01,"",GB269573944000,IT,EU
2,"22 June 26, 13:39",24GBBGBKCDMS135030,1,1601009105,H221,"SALSICCIA PURO SUINO 24GBBGBKCDMS135030",100,CHEDA.GB.2025.1013501,No,AHVLA,X00,"",GB269573944000,IT,EU
1,"22 June 26, 13:38",24GBBGBKCDMA128014,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112814,Yes,AHVLA,C06,"",GB269573944000,IT,EU
2,"22 June 26, 13:38",24GBBGBKCDMA128014,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112814,No,AHVLA,X00,"",GB269573944000,IT,EU
1,"22 June 26, 13:38",24GBBGBKCDMA128015,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112815,Yes,AHVLA,C06,"",GB269573944000,CA,RoW
2,"22 June 26, 13:38",24GBBGBKCDMA128015,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112815,No,AHVLA,X00,"",GB269573944000,CA,RoW
1,"22 June 26, 13:38",24GBBGBKCDMA128016,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112816,Yes,AHVLA,C06,"",GB269573944000,,RoW
2,"22 June 26, 13:38",24GBBGBKCDMA128016,1,1601009105,H221,"SALSICCIA PURO SUINO",100,CHEDA.GB.2025.1112816,No,AHVLA,X00,"",GB269573944000,,RoW
`)

  expect(headers['content-type']).toBe('text/csv; charset=utf-8')
  expect(headers['content-disposition']).toBe(
    'attachment; filename="level-matching-2026.06.22-2026.06.22.csv"'
  )
  expect(headers['cache-control']).toBe('no-store')

  const apiURL = wreck.request.mock.calls[0][1]
  const { pathname, searchParams } = new URL(apiURL)

  expect(pathname).toBe('/reporting-api/matches/data')
  expect(Object.fromEntries(searchParams)).toEqual({
    from: '2026-06-22T00:00:00.000Z',
    to: '2026-06-23T00:00:00.000Z',
    match: 'false'
  })
})
