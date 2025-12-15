import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByRole, getByText } from '@testing-library/dom'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedAdminUserSession, setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test.each([
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: 'information',
    resourceType: 'MRN'
  },
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: 'all-messages',
    resourceType: 'MRN'
  },
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: 'all-events',
    resourceType: 'MRN'
  },
  {
    searchTerm: 'CHEDPP.GB.2025.1010001',
    type: 'information',
    resourceType: 'CHED'
  },
  {
    searchTerm: 'CHEDPP.GB.2025.1010001',
    type: 'all-messages',
    resourceType: 'CHED'
  },
  {
    searchTerm: 'CHEDPP.GB.2025.1010001',
    type: 'all-events',
    resourceType: 'CHED'
  }
])(
  'Should show the admin search page',
  async ({ resourceType, searchTerm, type }) => {
    wreck.get
      .mockResolvedValueOnce({ payload: provider })
      .mockResolvedValueOnce({ payload: provider })
      .mockResolvedValueOnce({ payload: { hello: 'world' } })

    const server = await initialiseServer()
    const credentials = await setupAuthedAdminUserSession(server)

    const { payload } = await server.inject({
      method: 'get',
      url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=${searchTerm}&${queryStringParams.SEARCH_TYPE}=${type}`,
      auth: {
        strategy: 'session',
        credentials
      }
    })

    globalJsdom(payload)

    const table = getByRole(document.body, 'table')
    expect(getByRole(table, 'row', { name: '1 {' })).toBeInTheDocument()
    expect(
      getByRole(table, 'row', { name: '2 "hello": "world"' })
    ).toBeInTheDocument()
    expect(getByRole(table, 'row', { name: '3 }' })).toBeInTheDocument()

    expect(
      getByRole(document.body, 'link', {
        name: `${resourceType} Information`
      })
    ).toBeInTheDocument()
  }
)

test('Should deserialise nested JSON', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({
      payload: {
        chedId: 'CHEDPP.GB.2025.1010001',
        notValidJsonObject: '{ hello }',
        notValidJsonArray: '[ hello ]',
        otherData: '{"hello": "world"}',
        otherDataArray: ['{"hello": "world"}']
      }
    })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=CHEDPP.GB.2025.1010001&${queryStringParams.SEARCH_TYPE}=information`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  const expectedJson = [
    '{',
    '"chedId": "CHEDPP.GB.2025.1010001",',
    '"notValidJsonObject": "{ hello }",',
    '"notValidJsonArray": "[ hello ]",',
    '"otherData": {',
    '"hello": "world"',
    '},',
    '"otherDataArray": [',
    '{',
    '"hello": "world"',
    '}',
    ']',
    '}'
  ]

  const table = getByRole(document.body, 'table')
  expectedJson.forEach((line, index) => {
    expect(
      getByRole(table, 'row', { name: `${index + 1} ${line}` })
    ).toBeInTheDocument()
  })
})

test('Should render the admin view page with no search term or type supplied', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.ADMIN_SEARCH,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(200)
})

test('Should show an error when no search term is supplied', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=&${queryStringParams.SEARCH_TYPE}=information`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByText(document.body, 'Enter an MRN or CHED')
  ).toBeInTheDocument()
})

test.each([
  'abcd123s', 'GMRA00S11AB1', '5GB412342342000-LU123AB123456L123'
])('Should show an error with an invalid search term', async (testSearchTerm) => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=${testSearchTerm}&${queryStringParams.SEARCH_TYPE}=information`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByText(document.body, 'Enter an MRN or CHED in the correct format')
  ).toBeInTheDocument()
})

test('Should show a not found error with a search term that could not be found', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockRejectedValue({ output: { statusCode: 404 } })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=24GBBGBKCDMS895999&${queryStringParams.SEARCH_TYPE}=information`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByText(document.body, '24GBBGBKCDMS895999 cannot be found')
  ).toBeInTheDocument()
})

test('Should show the forbidden page when the user is not in the admin security group', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=24GBBGBKCDMS895999&${queryStringParams.SEARCH_TYPE}=information`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByText(document.body, 'You do not have the correct permissions to access this service')
  ).toBeInTheDocument()
})
