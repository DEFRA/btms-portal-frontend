import { mapSummary } from '../../../src/models/map-summary'

test('total of 0', () => {
  const summary = {
    clearanceRequests: {
      unique: 0,
      total: 0
    }
  }

  const actual = mapSummary(summary)
  const expected = [
    {
      heading: 'Unique clearance requests',
      tiles: [
        { label: 'Unique clearances', percentage: '0.00', total: 0 },
        { label: 'Total', percentage: null, total: 0 }
      ],
      type: 'clearanceRequests'
    }
  ]

  expect(actual).toEqual(expected)
})
