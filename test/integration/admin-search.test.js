import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByRole, getByText } from '@testing-library/dom'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedAdminUserSession, setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { ADMIN_SEARCH_TYPES } from '../../src/services/admin.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const ALL_EVENTS_SEARCH_RESULTS = [
  {
    id: "12345a972b123474b8059c7f",
    etag: "12345a972b123474b8059c81",
    created: "2025-12-15T14:26:31.834Z",
    updated: "2025-12-15T14:26:31.878Z",
    resourceId: "25GBAB123ZKAZZYAR1",
    resourceType: "CustomsDeclaration",
    subResourceType: "ClearanceRequest",
    operation: "Created",
    message: "{\"resourceId\":\"25GBAB123ZKAZZYAR1\",\"resourceType\":\"CustomsDeclaration\",\"subResourceType\":\"ClearanceRequest\",\"operation\":\"Created\",\"resource\":{\"id\":\"25GBAB123ZKAZZYAR1\",\"etag\":\"12345a972b123474b8059c81\",\"created\":\"2025-12-15T14:26:31.8306635Z\",\"updated\":\"2025-12-15T14:26:31.8306635Z\",\"clearanceRequest\":{\"externalCorrelationId\":\"1232133\",\"messageSentAt\":\"2025-12-15T14:26:31Z\",\"externalVersion\":1,\"previousExternalVersion\":null,\"declarationUcr\":\"5GB123407564000-JI123427\",\"declarationPartNumber\":null,\"declarationType\":\"S\",\"arrivesAt\":null,\"submitterTurn\":\"GB123468571234\",\"declarantId\":\"GB123407512345\",\"declarantName\":\"GB123407512345\",\"dispatchCountryCode\":\"DE\",\"goodsLocationCode\":\"DEUDEUDEUGVM\",\"masterUcr\":null,\"commodities\":[{\"itemNumber\":1,\"customsProcedureCode\":\"4000000\",\"taricCommodityCode\":\"1901909990\",\"goodsDescription\":\"Dairy based product\",\"consigneeId\":\"GB123486241234\",\"consigneeName\":\"GB123486241234\",\"netMass\":6123.8,\"supplementaryUnits\":0,\"thirdQuantity\":null,\"originCountryCode\":\"DE\",\"documents\":[{\"documentCode\":\"N853\",\"documentReference\":\"GBCHD2025.1234567\",\"documentStatus\":\"AE\",\"documentControl\":\"P\",\"documentQuantity\":null}],\"checks\":[{\"checkCode\":\"H222\",\"departmentCode\":\"PHA\"}]},{\"itemNumber\":2,\"customsProcedureCode\":\"4000000\",\"taricCommodityCode\":\"0403909100\",\"goodsDescription\":\"Dairy based product\",\"consigneeId\":\"GB12346241234\",\"consigneeName\":\"GB12346241234\",\"netMass\":10123.4,\"supplementaryUnits\":0,\"thirdQuantity\":null,\"originCountryCode\":\"DE\",\"documents\":[{\"documentCode\":\"N853\",\"documentReference\":\"GBCHD2025.1234147\",\"documentStatus\":\"AE\",\"documentControl\":\"P\",\"documentQuantity\":null}],\"checks\":[{\"checkCode\":\"H222\",\"departmentCode\":\"PHA\"}]}]},\"clearanceDecision\":null,\"finalisation\":null,\"externalErrors\":null},\"etag\":\"12345a972b123474b8059c7a\",\"timestamp\":\"2025-12-15T14:26:31.8345945Z\",\"changeSet\":[]}",
    published: "2025-12-15T14:26:31.878Z",
    expiresAt: "2026-06-13T14:26:31.834Z"
  }
]

const ALL_MESSAGES_SEARCH_RESULTS = [
  {
    id: "12345a972b123474b8059c7f",
    etag: "12345a972b123474b8059c81",
    created: "2025-12-15T14:26:31.799Z",
    updated: "2025-12-15T14:26:31.799Z",
    resourceId: "25GBAB123ZKAZZYAR1",
    resourceType: "ClearanceRequest",
    headers: {
      CorrelationId: "1234133",
      InboundHmrcMessageType: "ClearanceRequest",
      ResourceId: "25GBAB123ZKAZZYAR1",
    },
    messageId: "dab4e123-8724-467b-adf7-3e5ef3803456",
    message: "{\n  \"serviceHeader\": {\n    \"sourceSystem\": \"CDS\",\n    \"destinationSystem\": \"ALVS\",\n    \"correlationId\": \"1234133\",\n    \"serviceCallTimestamp\": \"2025-12-15T14:26:31Z\"\n  },\n  \"header\": {\n    \"entryReference\": \"25GBAB123ZKAZZYAR1\",\n    \"entryVersionNumber\": 1,\n    \"declarationUCR\": \"5GB123407564000-JI123427\",\n    \"declarationType\": \"S\",\n    \"submitterTURN\": \"GB123458571234\",\n    \"declarantId\": \"GB123407561234\",\n    \"declarantName\": \"GB123407561234\",\n    \"dispatchCountryCode\": \"DE\",\n    \"goodsLocationCode\": \"DEUDEUDEUGVM\"\n  },\n  \"items\": [\n    {\n      \"itemNumber\": 1,\n      \"customsProcedureCode\": \"4000000\",\n      \"taricCommodityCode\": \"1901909990\",\n      \"goodsDescription\": \"Dairy based product\",\n      \"consigneeId\": \"GB123456241234\",\n      \"consigneeName\": \"GB123456241234\",\n      \"itemNetMass\": 6123.8,\n      \"itemSupplementaryUnits\": 0,\n      \"itemOriginCountryCode\": \"DE\",\n      \"documents\": [\n        {\n          \"documentCode\": \"N853\",\n          \"documentReference\": \"GBCHD2025.7123456\",\n          \"documentStatus\": \"AE\",\n          \"documentControl\": \"P\"\n        }\n      ],\n      \"checks\": [\n        {\n          \"checkCode\": \"H222\",\n          \"departmentCode\": \"PHA\"\n        }\n      ]\n    },\n    {\n      \"itemNumber\": 2,\n      \"customsProcedureCode\": \"4000000\",\n      \"taricCommodityCode\": \"0403909100\",\n      \"goodsDescription\": \"Dairy based product\",\n      \"consigneeId\": \"GB123456241234\",\n      \"consigneeName\": \"GB123456241234\",\n      \"itemNetMass\": 10123.4,\n      \"itemSupplementaryUnits\": 0,\n      \"itemOriginCountryCode\": \"DE\",\n      \"documents\": [\n        {\n          \"documentCode\": \"N853\",\n          \"documentReference\": \"GBCHD2025.7123456\",\n          \"documentStatus\": \"AE\",\n          \"documentControl\": \"P\"\n        }\n      ],\n      \"checks\": [\n        {\n          \"checkCode\": \"H222\",\n          \"departmentCode\": \"PHA\"\n        }\n      ]\n    }\n  ]\n}",
    expiresAt: "2026-01-14T14:26:31.799Z"
  }
]

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test.each([
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: ADMIN_SEARCH_TYPES.INFORMATION,
    resourceType: 'MRN'
  },
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: ADMIN_SEARCH_TYPES.ALL_MESSAGES,
    resourceType: 'MRN'
  },
  {
    searchTerm: '24GBBGBKCDMS895001',
    type: ADMIN_SEARCH_TYPES.ALL_EVENTS,
    resourceType: 'MRN'
  }
])(
  'Should show the admin search page',
  async ({ resourceType, searchTerm, type }) => {
    let adminSearchResults = { mrn: '25GBAB1Y2OQH2HABC6' }
    switch (type) {
      case ADMIN_SEARCH_TYPES.ALL_EVENTS:
        adminSearchResults = ALL_EVENTS_SEARCH_RESULTS
        break
      case ADMIN_SEARCH_TYPES.ALL_MESSAGES:
        adminSearchResults = ALL_MESSAGES_SEARCH_RESULTS
        break
    }
    wreck.get
      .mockResolvedValueOnce({ payload: provider })
      .mockResolvedValueOnce({ payload: provider })
      .mockResolvedValueOnce({ payload: adminSearchResults })

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
    switch (type) {
      case ADMIN_SEARCH_TYPES.ALL_EVENTS:
      case ADMIN_SEARCH_TYPES.ALL_MESSAGES: {
        expect(getByRole(table, 'row', { name: '6 "resourceId": "25GBAB123ZKAZZYAR1",' })).toBeInTheDocument()
        break
      }
      case ADMIN_SEARCH_TYPES.INFORMATION: {
        expect(
          getByRole(table, 'row', { name: '2 "mrn": "25GBAB1Y2OQH2HABC6"' })
        ).toBeInTheDocument()
        expect(getByRole(table, 'row', { name: '3 }' })).toBeInTheDocument()
        expect(
          getByRole(document.body, 'link', {
            name: `${resourceType} Information`
          })).toBeInTheDocument()
        break
      }
    }
  }
)

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
