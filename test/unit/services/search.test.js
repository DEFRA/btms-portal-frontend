import { getSearchResults } from '../../../src/services/search.js'
import { config } from '../../../src/config/config.js'

const mockGetRelatedImportDeclarations = jest.fn()
const mockGetTracesChed = jest.fn()
const mockGetTracesChedCustomsDeclarations = jest.fn()

jest.mock('../../../src/services/imports-data-api-client.js', () => ({
  getRelatedImportDeclarations: (...args) => mockGetRelatedImportDeclarations(...args),
  getTracesChed: (...args) => mockGetTracesChed(...args),
  getTracesChedCustomsDeclarations: (...args) => mockGetTracesChedCustomsDeclarations(...args)
}))

const searchQuery = { chedId: 'CHEDA.GB.2025.0000001' }

afterEach(() => {
  config.set('isTracesChedsEnabled', false)
  jest.clearAllMocks()
})

describe('#getSearchResults', () => {
  describe('when the feature flag is disabled', () => {
    beforeEach(() => {
      config.set('isTracesChedsEnabled', false)
    })

    test('should use related import declarations and not call the traces endpoints', async () => {
      await getSearchResults(searchQuery)

      expect(mockGetRelatedImportDeclarations).toHaveBeenCalledWith(searchQuery)
      expect(mockGetTracesChed).not.toHaveBeenCalled()
      expect(mockGetTracesChedCustomsDeclarations).not.toHaveBeenCalled()
    })
  })

  describe('when the feature flag is enabled', () => {
    beforeEach(() => {
      config.set('isTracesChedsEnabled', true)
    })

    test.each([
      ['MRN', { mrn: '24GB0Z8WEJ9ZBTL73B' }],
      ['DUCR', { ducr: '1GB126344356000-ABC35932Y1BHX' }],
      ['GMR', { gmrId: 'GMRA00000AB1' }],
      ['VRN or TRN', { vrnOrTrn: 'HX66 BVL' }],
      ['partial CHED', { chedId: '2025.0000001' }],
      ['last 7 or 8 digits', { chedId: '0000001' }],
      ['CDS CHED', { chedId: 'GBCHD2024.5286242' }]
    ])('should use related import declarations for a %s search term', async (_type, query) => {
      await getSearchResults(query)

      expect(mockGetRelatedImportDeclarations).toHaveBeenCalledWith(query)
      expect(mockGetTracesChed).not.toHaveBeenCalled()
    })

    test('should use related import declarations when a TRACES CHED is not found', async () => {
      mockGetTracesChed.mockRejectedValue({
        isBoom: true,
        output: { statusCode: 404 }
      })

      await getSearchResults(searchQuery)

      expect(mockGetTracesChed).toHaveBeenCalledWith('CHEDA.GB.2025.0000001')
      expect(mockGetRelatedImportDeclarations).toHaveBeenCalledWith(searchQuery)
      expect(mockGetTracesChedCustomsDeclarations).not.toHaveBeenCalled()
    })

    test('should return the TRACES CHED and its linked customs declarations when a TRACES CHED is found', async () => {
      const tracesChed = { ched: { exchangedDocument: { identifier: 'CHEDA.GB.2025.0000001' } } }
      const customsDeclarations = [
        { movementReferenceNumber: '24GB0Z8WEJ9ZBTL73B', clearanceRequest: {}, clearanceDecision: {} }
      ]

      mockGetTracesChed.mockResolvedValue(tracesChed)
      mockGetTracesChedCustomsDeclarations.mockResolvedValue({ customsDeclarations })

      const result = await getSearchResults(searchQuery)

      expect(mockGetTracesChed).toHaveBeenCalledWith('CHEDA.GB.2025.0000001')
      expect(mockGetTracesChedCustomsDeclarations).toHaveBeenCalledWith('CHEDA.GB.2025.0000001')
      expect(result).toEqual({
        customsDeclarations,
        importPreNotifications: [],
        goodsVehicleMovements: [],
        cheds: [tracesChed]
      })
    })

    test('should rethrow errors other than not found', async () => {
      const upstreamError = { isBoom: true, output: { statusCode: 500 } }
      mockGetTracesChed.mockRejectedValue(upstreamError)

      await expect(getSearchResults(searchQuery)).rejects.toBe(upstreamError)
      expect(mockGetRelatedImportDeclarations).not.toHaveBeenCalled()
    })

    test('should use related import declarations when a TRACES CHED is not found', async () => {
      mockGetTracesChed.mockRejectedValue({
        isBoom: true,
        output: { statusCode: 404 }
      })

      await getSearchResults(searchQuery)

      expect(mockGetTracesChed).toHaveBeenCalledWith('CHEDA.GB.2025.0000001')
      expect(mockGetRelatedImportDeclarations).toHaveBeenCalledWith(searchQuery)
      expect(mockGetTracesChedCustomsDeclarations).not.toHaveBeenCalled()
    })
  })
})
