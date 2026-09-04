import { mapTracesCheds } from '../../../src/models/traces-cheds.js'

const createTracesChed = (identifier, updated) => ({
  ched: {
    exchangedDocument: {
      identifier
    }
  },
  created: '2025-01-01T09:00:00.000Z',
  updated
})

describe('#mapTracesCheds', () => {
  test('should map TRACES CHEDs to references and formatted updated dates', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', '2025-06-01T09:30:00.000Z'),
        createTracesChed('CHEDP.GB.2025.0000002', '2025-07-02T10:00:00.000Z')
      ]
    }

    expect(mapTracesCheds(searchResults, 'CHEDP.GB.2025.0000002')).toEqual([
      {
        reference: 'CHEDP.GB.2025.0000002',
        updated: '2 July 2025, 10:00'
      },
      {
        reference: 'CHEDA.GB.2025.0000001',
        updated: '1 June 2025, 09:30'
      }
    ])
  })

  test('should order the CHED matching the search term first', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', '2025-07-01T09:00:00.000Z'),
        createTracesChed('CHEDP.GB.2025.0000002', '2025-06-01T09:00:00.000Z')
      ]
    }

    const result = mapTracesCheds(searchResults, 'CHEDP.GB.2025.0000002')

    expect(result[0].reference).toBe('CHEDP.GB.2025.0000002')
  })

  test('should order by updated date descending when no search term match', () => {
    const searchResults = {
      cheds: [
        createTracesChed('CHEDA.GB.2025.0000001', '2025-06-01T09:00:00.000Z'),
        createTracesChed('CHEDP.GB.2025.0000002', '2025-07-01T09:00:00.000Z')
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
