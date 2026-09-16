import { mapTracesCheds, getTracesChedStatus } from '../../../src/models/traces-cheds.js'
import { mapResourceEvents, RESOURCE_TYPE } from '../../../src/models/resource-events.js'

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
      documentStatusCode: options.documentStatusCode ?? '1',
      secondSignatoryAuthentication: options.secondSignatoryAuthentication ?? null
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

  describe('decision mapping', () => {
    const createClearanceSignatory = (clauses = []) => ({
      typeCode: '1',
      includedClause: clauses.map(({ identifier, content }) => ({ identifier, content }))
    })

    test('should map the DECISION_CONCLUSION decision onto every commodity', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', {
            tradeLineItems: [
              createTradeLineItem({ sequenceNumeric: 1 }),
              createTradeLineItem({ sequenceNumeric: 2 })
            ],
            secondSignatoryAuthentication: createClearanceSignatory([
              { identifier: 'DECISION_CONCLUSION', content: 'ACCEPTABLE_FOR_FREE_CIRCULATION' },
              { identifier: 'DOCUMENTARY_CHECK', content: 'NO' }
            ])
          })
        ]
      }

      const commodities = mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities

      expect(commodities.map(({ decision }) => decision)).toEqual([
        'Acceptable for free circulation',
        'Acceptable for free circulation'
      ])
    })

    test('should map all known DECISION_CONCLUSION values', () => {
      const knownConclusions = [
        ['ACCEPTABLE_FOR_INTERNAL_MARKET', 'Acceptable for internal market'],
        ['ACCEPTABLE_FOR_FREE_CIRCULATION', 'Acceptable for free circulation'],
        ['ACCEPTABLE_FOR_DIRECT_TRANSIT', 'Acceptable for direct transit'],
        ['ACCEPTABLE_FOR_INDIRECT_TRANSIT', 'Acceptable for indirect transit'],
        ['ACCEPTABLE_FOR_MONITORING', 'Acceptable for monitoring'],
        ['ACCEPTABLE_FOR_ONWARD_TRANSPORTATION', 'Acceptable for onward transportation'],
        ['ACCEPTABLE_FOR_ONWARD_TRAVEL', 'Acceptable for onward travel'],
        ['ACCEPTABLE_FOR_PRIVATE_IMPORT', 'Acceptable for private import'],
        ['ACCEPTABLE_FOR_TEMPORARY_ADMISSION', 'Acceptable for temporary admission'],
        ['ACCEPTABLE_FOR_TRANSFER', 'Acceptable for transfer'],
        ['ACCEPTABLE_FOR_TRANSHIPMENT', 'Acceptable for transhipment'],
        ['ACCEPTABLE_FOR_TRANSIT_TO_US_OR_NATO_BASE', 'Acceptable for transit to US or NATO base'],
        ['NOT_ACCEPTABLE', 'Not acceptable']
      ]

      for (const [content, expected] of knownConclusions) {
        const searchResults = {
          cheds: [
            createTracesChed('CHEDA.GB.2025.0000001', {
              tradeLineItems: [createTradeLineItem({ sequenceNumeric: 1 })],
              secondSignatoryAuthentication: createClearanceSignatory([
                { identifier: 'DECISION_CONCLUSION', content }
              ])
            })
          ]
        }

        expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
          expect.objectContaining({ decision: expected })
        ])
      }
    })

    test('should show Unknown (CODE) when the DECISION_CONCLUSION value is unmapped', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', {
            tradeLineItems: [createTradeLineItem({ sequenceNumeric: 1 })],
            secondSignatoryAuthentication: createClearanceSignatory([
              { identifier: 'DECISION_CONCLUSION', content: 'SOME_NEW_CONCLUSION' }
            ])
          })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
        expect.objectContaining({ decision: 'Unknown (SOME_NEW_CONCLUSION)' })
      ])
    })

    test('should fall back to Decision not given when there is no second signatory authentication', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', {
            tradeLineItems: [createTradeLineItem({ sequenceNumeric: 1 })]
          })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
        expect.objectContaining({ decision: 'Decision not given' })
      ])
    })

    test('should fall back to Decision not given when the DECISION_CONCLUSION is missing', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', {
            tradeLineItems: [createTradeLineItem({ sequenceNumeric: 1 })],
            secondSignatoryAuthentication: createClearanceSignatory([
              { identifier: 'DOCUMENTARY_CHECK', content: 'YES' }
            ])
          })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
        expect.objectContaining({ decision: 'Decision not given' })
      ])
    })

    test('should fall back to Decision not given when the DECISION_CONCLUSION content is empty', () => {
      const searchResults = {
        cheds: [
          createTracesChed('CHEDA.GB.2025.0000001', {
            tradeLineItems: [createTradeLineItem({ sequenceNumeric: 1 })],
            secondSignatoryAuthentication: createClearanceSignatory([
              { identifier: 'DECISION_CONCLUSION', content: null }
            ])
          })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].commodities).toEqual([
        expect.objectContaining({ decision: 'Decision not given' })
      ])
    })
  })

  describe('document status code mapping', () => {
    test.each([
      ['1','New'],
      ['35','Authorised for onward travel'],
      ['41','Rejected'],
      ['42','In progress'],
      ['44','Replaced'],
      ['47','Draft'],
      ['55','Deleted'],
      ['64','Cancelled'],
      ['68','Split'],
      ['70','Validated'],
      ['97','Authorised for onward transportation'],
      ['99','Authorised for transit'],
      ['122','Partially rejected'],
      ['124','Authorised for transfer to'],
      ['146','Authorised for transhipment']
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
          createTracesChed('CHEDA.GB.2025.0000001', { documentStatusCode: '9999' })
        ]
      }

      expect(mapTracesCheds(searchResults, 'CHEDA.GB.2025.0000001')[0].status).toBe('Unknown (9999)')
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
        quantityWeight: '1000 KGM',
        decision: 'Decision not given'
      },
      {
        itemNumber: 2,
        commodityCode: '03019985',
        description: 'Equus',
        quantityWeight: '2500 KGM',
        decision: 'Decision not given'
      },
      {
        itemNumber: 3,
        commodityCode: '05071000',
        description: 'PRODUCTS OF ANIMAL ORIGIN, NOT ELSEWHERE SPECIFIED OR INCLUDED',
        quantityWeight: '2500 KGM',
        decision: 'Decision not given'
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
        quantityWeight: undefined,
        decision: 'Decision not given'
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
        quantityWeight: '1000 KGM',
        decision: 'Decision not given'
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
        quantityWeight: '1000 KGM',
        decision: 'Decision not given'
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

const tracesChedSearchResult = (documentStatusCode) => ({
  cheds: [
    {
      ched: {
        exchangedDocument: { identifier: 'CHEDA.GB.2025.0000001', documentStatusCode },
        lastUpdated: null,
        specifiedConsignment: {}
      },
      created: '2025-01-01T09:00:00.000Z',
      updated: '2025-01-01T09:00:00.000Z'
    }
  ]
})

const tracesChedResourceEvent = (documentStatusCode) => ({
  resourceType: RESOURCE_TYPE.TRACES_CHED,
  message: JSON.stringify({
    resource: {
      id: 'CHEDA.GB.2025.0000001',
      ched: {
        exchangedDocument: { identifier: 'CHEDA.GB.2025.0000001', documentStatusCode },
        lastUpdated: null
      }
    }
  })
})

describe('getTracesChedStatus', () => {
  test('is the single source of the status for both the search result screen and the timeline', () => {
    const documentStatusCode = '55'

    const searchResultStatus = mapTracesCheds(tracesChedSearchResult(documentStatusCode), 'CHEDA.GB.2025.0000001')[0].status
    const timelineStatus = mapResourceEvents(undefined, 'CHEDA.GB.2025.0000001', [tracesChedResourceEvent(documentStatusCode)])[0].status

    expect(searchResultStatus).toBe(getTracesChedStatus(documentStatusCode))
    expect(timelineStatus).toBe(getTracesChedStatus(documentStatusCode))
    expect(searchResultStatus).toBe(timelineStatus)
  })

  test('is the single source of the Unknown fallback for both the search result screen and the timeline', () => {
    const documentStatusCode = '999'

    const searchResultStatus = mapTracesCheds(tracesChedSearchResult(documentStatusCode), 'CHEDA.GB.2025.0000001')[0].status
    const timelineStatus = mapResourceEvents(undefined, 'CHEDA.GB.2025.0000001', [tracesChedResourceEvent(documentStatusCode)])[0].status

    expect(searchResultStatus).toBe(getTracesChedStatus(documentStatusCode))
    expect(timelineStatus).toBe(getTracesChedStatus(documentStatusCode))
    expect(searchResultStatus).toBe(timelineStatus)
  })

  test('describes a numeric document status code', () => {
    expect(getTracesChedStatus(1)).toBe('New')
  })

  test('does not return inherited object members for an unmapped status code', () => {
    expect(getTracesChedStatus('toString')).toBe('Unknown (toString)')
  })
})