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

test('shows GMR result', async () => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [
      {
        movementReferenceNumber: "25GB00000000000001",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  checkCode: "H224",
                  decisionCode: "X00"
                }
              ]
            }
          ]
        },
        finalisation: null
      }
    ],
    goodsVehicleMovements: [
      {
        gmr: {
          id: "GMRA00000AB1",
          vehicleRegistrationNumber: "ABC 111",
          trailerRegistrationNums: [
            "ABC 222",
            "ABC 333"
          ],
          declarations: {
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
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=GMRA00000AB1`,
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
    'Showing result for GMRA00000AB1 - Border Trade Matching Service'
  )
  expect(getByText(document.body, 'GMRA00000AB1')).toBeInTheDocument()
  expect(getByText(document.body, 'Vehicle details')).toBeInTheDocument()
  expect(getByText(document.body, 'Linked customs declarations')).toBeInTheDocument()

  const vehicleRegistrationNumber = getByText(document.body, 'ABC 111')
  expect(vehicleRegistrationNumber).toBeInTheDocument()
  expect(vehicleRegistrationNumber.className).toEqual('vehicle-number-plate vehicle-number-plate--front')

  const trailerRegistrationNumber1 = getByText(document.body, 'ABC 222')
  expect(trailerRegistrationNumber1).toBeInTheDocument()
  expect(trailerRegistrationNumber1.className).toEqual('vehicle-number-plate vehicle-number-plate--rear')
  const trailerRegistrationNumber2 = getByText(document.body, 'ABC 333')
  expect(trailerRegistrationNumber2).toBeInTheDocument()
  expect(trailerRegistrationNumber2.className).toEqual('vehicle-number-plate vehicle-number-plate--rear')

  expect(
    getByRole(document.body, 'link', {
      name: '25GB00000000000001'
    })
  ).toHaveAttribute('href', '/search-result?searchTerm=25GB00000000000001')

  const unknownMrn = getByText(document.body, '25GB00000000000002')
  expect(unknownMrn).toBeInTheDocument()
  expect(unknownMrn.className).toEqual('tooltiplink mrn--unknown')

  const knownMrnCdsStatus = getByText(document.body, 'In progress')
  expect(knownMrnCdsStatus).toBeInTheDocument()
  expect(knownMrnCdsStatus.className).toEqual('govuk-!-font-weight-bold govuk-tag govuk-tag--yellow')

  const unknownMrnCdsStatus = getByText(document.body, 'Unknown', { selector: 'span' })
  expect(unknownMrnCdsStatus).toBeInTheDocument()
  expect(unknownMrnCdsStatus.className).toEqual('govuk-!-font-weight-bold govuk-tag govuk-tag--grey')

  const unknownMrnBtmsDecision = getByText(document.body, 'Unknown', { selector: 'td' })
  expect(unknownMrnBtmsDecision).toBeInTheDocument()
  expect(unknownMrnBtmsDecision.className).toEqual('govuk-table__cell')
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
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=GMRA00000AB1`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('redirects to search page for missing search', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('redirects to search page for incorrect search', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=NOT_SEARCHABLE`,
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
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=GMRA00000AB1`
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
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=GMRA00000AB1`,
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

test('redirects to search page if not GMR search term', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73Y`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})
