import { mapReports } from '../../../src/models/reports'

test('total of 0', () => {
  const summary = {
    clearanceRequests: {
      unique: 0,
      total: 0
    }
  }

  const actual = mapReports(summary)
  const expected = [
    {
      heading: 'Unique clearance requests',
      tiles: [
        { label: 'Unique clearances', percentage: '0', total: 0 },
        { label: 'Total', percentage: null, total: 0 }
      ],
      type: 'clearanceRequests'
    }
  ]

  expect(actual).toEqual(expected)
})
