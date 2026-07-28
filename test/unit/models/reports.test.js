import { mapMatchingReports, mapReports } from '../../../src/models/reports'

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
      head: [{ text: 'Type' }, { text: '03 Sep 10:47' }],
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

test('map matching reports', () => {
  const apiPayload = {
    total: 1000,
    eu: {
      total: 780,
      match: {
        total: 750,
        level1: 750,
        level2: 712,
        level3: 625
      },
      noMatch: {
        total: 30,
        level1: 30,
        level2: 58,
        level3: 81
      }
    },
    row: {
      total: 220,
      match: {
        total: 200,
        level1: 200,
        level2: 191,
        level3: 240
      },
      noMatch: {
        total: 20,
        level1: 20,
        level2: 39,
        level3: 54
      }
    }
  }

  const actual = mapMatchingReports(apiPayload)

  const expected = [
    {
      heading: "Level 1 match rates",
      regionSplits: {
        matches: [
          {
            label: "EU",
            percentage: "75",
            total: "750",
            type: "match"
          },
          {
            label: "RoW",
            percentage: "20",
            total: "200",
            type: "match"
          },
          {
            label: "Total",
            percentage: null,
            total: "950",
            type: "total"
          }
        ],
        noMatches: [
          {
            label: "EU",
            percentage: "3",
            total: "30",
            type: "nomatch"
          },
          {
            label: "RoW",
            percentage: "2",
            total: "20",
            type: "nomatch"
          },
          {
            label: "Total",
            percentage: null,
            total: "50",
            type: "total"
          }
        ]
      },
      tiles: [
        {
          label: "Matches",
          percentage: "95",
          total: "950",
          type: "match"
        },
        {
          label: "No matches",
          percentage: "5",
          total: "50",
          type: "nomatch"
        },
        {
          label: "Total",
          percentage: null,
          total: "1,000",
          type: "total"
        }
      ],
      type: "level1"
    },
    {
      heading: "Level 2 match rates",
      regionSplits: {
        matches: [
          {
            label: "EU",
            percentage: "71.20",
            total: "712",
            type: "match"
          },
          {
            label: "RoW",
            percentage: "19.10",
            total: "191",
            type: "match"
          },
          {
            label: "Total",
            percentage: null,
            total: "903",
            type: "total"
          }
        ],
        noMatches: [
          {
            label: "EU",
            percentage: "5.80",
            total: "58",
            type: "nomatch"
          },
          {
            label: "RoW",
            percentage: "3.90",
            total: "39",
            type: "nomatch"
          },
          {
            label: "Total",
            percentage: null,
            total: "97",
            type: "total"
          }
        ]
      },
      tiles: [
        {
          label: "Matches",
          percentage: "90.30",
          total: "903",
          type: "match"
        },
        {
          label: "No matches",
          percentage: "9.70",
          total: "97",
          type: "nomatch"
        },
        {
          label: "Total",
          percentage: null,
          total: "1,000",
          type: "total"
        }
      ],
      type: "level2"
    },
    {
      heading: "Level 3 match rates",
      regionSplits: {
        matches: [
          {
            label: "EU",
            percentage: "62.50",
            total: "625",
            type: "match"
          },
          {
            label: "RoW",
            percentage: "24",
            total: "240",
            type: "match"
          },
          {
            label: "Total",
            percentage: null,
            total: "865",
            type: "total"
          }
        ],
        noMatches: [
          {
            label: "EU",
            percentage: "8.10",
            total: "81",
            type: "nomatch"
          },
          {
            label: "RoW",
            percentage: "5.40",
            total: "54",
            type: "nomatch"
          },
          {
            label: "Total",
            percentage: null,
            total: "135",
            type: "total"
          }
        ]
      },
      tiles: [
        {
          label: "Matches",
          percentage: "86.50",
          total: "865",
          type: "match"
        },
        {
          label: "No matches",
          percentage: "13.50",
          total: "135",
          type: "nomatch"
        },
        {
          label: "Total",
          percentage: null,
          total: "1,000",
          type: "total"
        }
      ],
      type: "level3"
    }
  ]

  expect(actual).toEqual(expected)
})
