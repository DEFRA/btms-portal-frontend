import { gmrSearchResult } from '../../../src/routes/gmr-search-result.js'
import { metricName } from '../../../src/models/model-constants.js'

const mockMetricCounter = jest.fn()
const mockGetRelatedImportDeclarations = jest.fn()

jest.mock('../../../src/utils/metrics.js', () => ({
  metricsCounter: (...args) => mockMetricCounter(...args)
}))

jest.mock('../../../src/services/related-import-declarations.js', () => ({
  getRelatedImportDeclarations: (...args) => mockGetRelatedImportDeclarations(...args)
}))

const mockRequest = {
  query: {
    searchTerm: 'GMRA00000000'
  },
  yar: {
    flash: () => jest.fn()
  }
}

const mockHandler = {
  redirect: () => {
    return {
      takeover: jest.fn()
    }
  }
}

test('Should emit GMR search not found metric when no records found', async () => {
  mockGetRelatedImportDeclarations.mockReturnValue({
    goodsVehicleMovements: []
  })

  await gmrSearchResult.options.handler(mockRequest, mockHandler)

  expect(mockMetricCounter).toHaveBeenCalledWith(metricName.GMR_NOT_FOUND)
})

test('Should emit GMR search metric', async () => {
  mockGetRelatedImportDeclarations.mockReturnValue({
    goodsVehicleMovements: []
  })

  await gmrSearchResult.options.pre[0].method(mockRequest, mockHandler)

  expect(mockMetricCounter).toHaveBeenCalledWith(metricName.GMR_ID)
})
