import { mapTracesCheds } from '../../../src/models/traces-cheds.js'

const createTradeLineItem = ({
  sequenceNumeric = 0,
  classificationSystemId = 'CN',
  commodityCode = '03019985',
  className = null,
  scientificName = null,
  netWeight = null
} = {}) => ({
  sequenceNumeric,
  applicableClassification: classificationSystemId
    ? [{ systemId: classificationSystemId, classCode: { value: commodityCode }, className: [className] }]
    : null,
  scientificName,
  netWeight
})

const createTracesChed = (identifier, options = {}) => ({
  ched: {
    exchangedDocument: {
      identifier,
      documentStatusCode: options.documentStatusCode ?? '1'
    },
    lastUpdated: options.lastUpdated ?? null,
    specifiedConsignment: {
      includedConsignmentItem: [
        { includedTradeLineItem: options.tradeLineItems ?? [] }
      ]
    }
  },
  created: '2025-01-01T09:00:00.000Z',
  updated: options.updated ?? '2025-01-01T09:00:00.000Z'
})

describe('#mapTracesCheds', () => {
  test('should map reference, status and formatted lastUpdated date', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', {
          documentStatusCode: '1',
          lastUpdated: '2025-06-01T09:30:00.000Z'
        })
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')).toEqual([
      {
        reference: 'CHEDA.GB.2025.0000001',
        status: 'New',
        updated: '1 June 2025, 09:30',
        commodities: []
      }
    ])
  })

  describe('document status code mapping', () => {
    test.each([
      ['1', 'New'],
      ['41', 'Rejected'],
      ['42', 'In Progress'],
      ['47', 'Draft'],
      ['64', 'Cancelled'],
      ['70', 'Valid']
    ])('should map documentStatusCode %s to %s', (documentStatusCode, expectedStatus) => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', { documentStatusCode })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].status).toBe(expectedStatus)
    })

    test('should map an unmapped documentStatusCode to Unknown', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', { documentStatusCode: '99' })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].status).toBe('Unknown (99)')
    })

    test('should map a missing documentStatusCode to Unknown', () => {
      const searchResults = {
        cheds: [
          {
            ched: {
              exchangedDocument: {
                identifier: 'CHEDA.GB.2025.0000001',
                documentStatusCode: undefined
              },
              lastUpdated: null,
              specifiedConsignment: {}
            },
            created: '2025-01-01T09:00:00.000Z',
            updated: '2025-01-01T09:00:00.000Z'
          }
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].status).toBe('Unknown (undefined)')
    })
  })

  test('should map commodities from trade line items, excluding consignment totals lines', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', {
          tradeLineItems: [
            createTradeLineItem({
              sequenceNumeric: 0,
              classificationSystemId: null,
              netWeight: { content: '3600', unitCode: 'KGM' }
            }),
            createTradeLineItem({
              sequenceNumeric: 1,
              scientificName: 'Salmo salar',
              netWeight: { content: '1000', unitCode: 'KGM' }
            }),
            createTradeLineItem({
              sequenceNumeric: 2,
              scientificName: 'Equus',
              netWeight: { content: '2500', unitCode: 'KGM' }
            }),
            createTradeLineItem({
              sequenceNumeric: 3,
              commodityCode: '05071000',
              scientificName: null,
              netWeight: { content: '2500', unitCode: 'KGM' },
              className: 'PRODUCTS OF ANIMAL ORIGIN, NOT ELSEWHERE SPECIFIED OR INCLUDED'
            }),
          ]
        })
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
      {
        itemNumber: 1,
        commodityCode: '03019985',
        description: 'Salmo salar',
        quantityWeight: '1000 KGM'
      },
      {
        itemNumber: 2,
        commodityCode: '03019985',
        description: 'Equus',
        quantityWeight: '2500 KGM'
      },
      {
        itemNumber: 3,
        commodityCode: '05071000',
        description: 'PRODUCTS OF ANIMAL ORIGIN, NOT ELSEWHERE SPECIFIED OR INCLUDED',
        quantityWeight: '2500 KGM'
      }
    ])
  })

  test('should use the CN classification when other classification systems are present', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', {
          tradeLineItems: [
            {
              sequenceNumeric: 1,
              applicableClassification: [
                { systemId: 'INVASIVE_NOT_ALLOWED', classCode: { value: 'WRONG' } },
                { systemId: 'CN', classCode: { value: '03019985' } }
              ],
              scientificName: null,
              netWeight: null
            }
          ]
        })
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
      {
        itemNumber: 1,
        commodityCode: '03019985',
        description: 'UNKNOWN',
        quantityWeight: undefined
      }
    ])
  })

  test('should fall back to the CN class name when scientificName is null', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', {
          tradeLineItems: [
            createTradeLineItem({
              sequenceNumeric: 1,
              commodityCode: '05071000',
              scientificName: null,
              netWeight: { content: '1000', unitCode: 'KGM' },
              className: 'PRODUCTS OF ANIMAL ORIGIN, NOT ELSEWHERE SPECIFIED OR INCLUDED'
            })
          ]
        })
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
      {
        itemNumber: 1,
        commodityCode: '05071000',
        description: 'PRODUCTS OF ANIMAL ORIGIN, NOT ELSEWHERE SPECIFIED OR INCLUDED',
        quantityWeight: '1000 KGM'
      }
    ])
  })

  test('should map description as UNKNOWN when scientificName and class name are missing', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', {
          tradeLineItems: [
            createTradeLineItem({
              sequenceNumeric: 1,
              scientificName: null,
              className: null,
              netWeight: { content: '1000', unitCode: 'KGM' }
            })
          ]
        })
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
      {
        itemNumber: 1,
        commodityCode: '03019985',
        description: 'UNKNOWN',
        quantityWeight: '1000 KGM'
      }
    ])
  })

  test('should map updated as undefined when lastUpdated is missing', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', { lastUpdated: null })
      ]
    }

    const mapped = mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')

    expect(mapped[0].updated).toBeUndefined()
    expect(mapped[0].reference).toBe('CHEDA.GB.2025.0000001')
  })

  test('should order the CHED matching the search term first', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', { lastUpdated: '2025-07-01T09:00:00.000Z' }),
        createTracesChed('CHEDP.GB.2025.0000002', { lastUpdated: '2025-06-01T09:00:00.000Z' })
      ]
    }

    const result = mapTracesCheds(searchResults, 'CHEDP.GB.2025.0000002')

    expect(result[0].reference).toBe('CHEDP.GB.2025.0000002')
  })

  test('should order by updated date descending when no search term match', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', { lastUpdated: '2025-06-01T09:00:00.000Z' }),
        createTracesChed('CHEDP.GB.2025.0000002', { lastUpdated: '2025-07-01T09:00:00.000Z' })
      ]
    }

    const result = mapTracesCheds(searchResults, 'CHEDD.GB.2025.0000003')

    expect(result.map(({ reference }) => reference)).toEqual([
      'CHEDP.GB.2025.0000002',
      'CHEDA.GB.2025.0000001'
    ])
  })

  test('should return an empty array when there are no TRACES CHEDs', () => {
    expect(mapTracesCheds({}, 'CHEDA.GB.2025.0000001')).toEqual([])
    expect(mapTracesCheds({ cheds: [] }, 'CHEDA.GB.2025.0000001')).toEqual([])
  })
})