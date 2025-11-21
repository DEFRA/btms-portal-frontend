import { gmrSearchResult } from '../../../src/routes/gmr-search-result.js'
import { METRIC_NAMES } from '../../../src/utils/metrics.js'

const mockMetricCounter = jest.fn()
const mockGetRelatedImportDeclarations = jest.fn()
const mockMapGoodsVehicleMovements = jest.fn()

jest.mock('../../../src/utils/metrics.js', () => ({
  metricsCounter: (...args) => mockMetricCounter(...args),
  METRIC_NAMES: jest.requireActual('../../../src/utils/metrics.js').METRIC_NAMES,
  getMetricNameBySearchType: jest.requireActual('../../../src/utils/metrics.js').getMetricNameBySearchType
}))

jest.mock('../../../src/services/imports-data-api-client.js', () => ({
  getRelatedImportDeclarations: (...args) => mockGetRelatedImportDeclarations(...args)
}))

jest.mock('../../../src/models/goods-vehicle-movements.js', () => ({
  mapGoodsVehicleMovements: (...args) => mockMapGoodsVehicleMovements(...args)
}))

const mockRequest = {
  query: {
    searchTerm: 'GMRA00000000'
  },
  pre: {
    searchQuery: { "gmrId": 'GMRA00000000'}
  },
  yar: {
    flash: () => jest.fn()
  },
  logger: {
    info: jest.fn()
  }
}

const mockHandler = {
  redirect: () => {
    return {
      takeover: jest.fn()
    }
  },
  view: jest.fn()
}

test('Should emit GMR search not found metric when no records found', async () => {
  mockGetRelatedImportDeclarations.mockReturnValue({
    goodsVehicleMovements: []
  })

  await gmrSearchResult.options.handler(mockRequest, mockHandler)

  expect(mockMetricCounter).toHaveBeenCalledWith(METRIC_NAMES.GMR_NOT_FOUND)
})

test('Should emit GMR search metric', async () => {
  mockGetRelatedImportDeclarations.mockReturnValue({
    goodsVehicleMovements: []
  })

  await gmrSearchResult.options.pre[0].method(mockRequest, mockHandler)

  expect(mockMetricCounter).toHaveBeenCalledWith(METRIC_NAMES.GMR_ID)
})

test.each([
  {
    knownMrnsCount: 1,
    unknownMrnsCount: 0
  },
  {
    knownMrnsCount: 1,
    unknownMrnsCount: 1
  },
  {
    knownMrnsCount: 0,
    unknownMrnsCount: 1
  },
  {
    knownMrnsCount: 0,
    unknownMrnsCount: 0
  }
])('Emits metrics when counts greater than zero', async (options) => {
  const relatedImportDeclarationsPayload = {
    customsDeclarations: [
      {
        movementReferenceNumber: "25GB00000000000001",
        clearanceDecision: {
          items: [
            {
              checks: [
                {
                  checkCode: "H222",
                  decisionCode: "X00"
                }
              ]
            }
          ],
          results: [
            {
              checkCode: "H222",
              internalDecisionCode: "X00"
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
          trailerRegistrationNums: ["ABC 222"],
          declarations: {
            customs: [
              {
                id: "25GB00000000000001"
              }
            ]
          }
        }
      }
    ]
  }

  mockGetRelatedImportDeclarations.mockReturnValue({
    goodsVehicleMovements: [ relatedImportDeclarationsPayload ]
  })

  mockMapGoodsVehicleMovements.mockReturnValue({
    mrnCounts: {
      known: options.knownMrnsCount,
      unknown: options.unknownMrnsCount
    }
  })

  await gmrSearchResult.options.handler(mockRequest, mockHandler)

  options.knownMrnsCount > 0
    ? expect(mockMetricCounter).toHaveBeenCalledWith(METRIC_NAMES.GVM_KNOWN_MRNS, options.knownMrnsCount)
    : expect(mockMetricCounter).not.toHaveBeenCalledWith(METRIC_NAMES.GVM_KNOWN_MRNS, 0)

  options.unknownMrnsCount > 0
    ? expect(mockMetricCounter).toHaveBeenCalledWith(METRIC_NAMES.GVM_UNKNOWN_MRNS, options.unknownMrnsCount)
    : expect(mockMetricCounter).not.toHaveBeenCalledWith(METRIC_NAMES.GVM_UNKNOWN_MRNS, 0)
})
