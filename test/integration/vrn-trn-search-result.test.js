import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { getByText, getByRole } from '@testing-library/dom'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('shows VRN TRN result', async () => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [],
    goodsVehicleMovements: [
      {
        gmr: {
          id: "GMRA00000AB1",
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [],
          actualCrossing: {
            routeId: "21",
            arrivesAt: "2025-09-28T23:01:00"
          },
          declarations: {
            transits: [],
            customs: [
              {
                id: "25GB00000000000001"
              },
              {
                id: "25GB00000000000002"
              }
            ]
          }
        }
      }
    ]
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: relatedImportDeclarationsPayload })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, headers } = await server.inject({
    method: 'get',
    url: `${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=ABC 111`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics": "no"}').toString('base64')
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)

  expect(document.title).toBe(
    'Showing result for ABC 111 - Border Trade Matching Service'
  )
  expect(getByText(document.body, 'ABC 111')).toBeInTheDocument()
  expect(getByRole(document.body, 'heading', {
    name: 'Linked GMRs'
  })).toBeInTheDocument()

  expect(
    getByRole(document.body, 'link', {
      name: 'GMRA00000AB1'
    })
  ).toHaveAttribute('href', '/gmr-search-result?searchTerm=GMRA00000AB1')

  expect(
    getByRole(document.body, 'row', {
      name: 'GMRA00000AB1 2 28 September 2025, 23:01'
    })
  ).toBeInTheDocument()
})

test('redirects to search page if no results', async () => {
  const noResults = {
    customsDeclarations: [],
    goodsVehicleMovements: []
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: noResults })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=ABC 111`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('redirect non authorised requests', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: `${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=ABC 111`
  })

  expect(statusCode).toBe(302)
})

test('handles upstream errors', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'get',
    url: `${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=ABC 111`,
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
