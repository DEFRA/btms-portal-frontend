import { mapReports } from '../../../src/models/reports'

test('total of 0', () => {
  const apiPAyload = {
    clearanceRequests: {
      intervals: [
        {
          interval: '2025-10-03T10:47:39.550Z',
          summary: { unique: 0, total: 0 }
        }
      ]
    }
  }
  const labels = ['03 Sep 10:47']

  const actual = mapReports(apiPAyload, labels)
  const expected = [
    {
      heading: 'Unique clearance requests',
      charts: [
        {
          label: 'Unique clearances',
          data: [0],
          borderColor: '#5694ca'
        }
      ],
      head: [{ text: '' }, { text: '03 Sep 10:47' }],
      rows: [[{ text: 'Unique clearances' }, { text: 0 }]],
      tiles: [
        {
          label: 'Unique clearances',
          percentage: null,
          total: '0',
          type: 'unique'
        },
        { label: 'Total', percentage: null, total: '0', type: 'total' }
      ],
      type: 'clearanceRequests'
    }
  ]

  expect(actual).toEqual(expected)
})
