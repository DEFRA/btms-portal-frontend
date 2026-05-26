const calculatePercentage = (part, total) => {
  if (!total) {
    return null
  }

  const value = (part / total) * 100
  return roundValue(value)
}

const roundValue = (value) => {
  const decimalPlaces = Number.isInteger(value) ? 0 : 2
  return value.toFixed(decimalPlaces)
}

const headings = {
  releases: 'Releases',
  matches: 'Matches',
  clearanceRequests: 'Unique clearance requests',
  notifications: 'Pre-notifications by CHED type'
}

const labels = {
  automatic: 'Automatic',
  manual: 'Manual',
  match: 'Matches',
  noMatch: 'No matches',
  unique: 'Unique clearances',
  chedA: 'CHED A',
  chedP: 'CHED P',
  chedPp: 'CHED PP',
  chedD: 'CHED D',
  total: 'Total'
}

const colours = {
  blue: '#5694ca',
  green: '#2ba8a3',
  orange: '#f57c00',
  pink: '#d81b60'
}

const lineColours = {
  automatic: colours.blue,
  chedA: colours.pink,
  chedD: colours.orange,
  chedP: colours.green,
  chedPp: colours.blue,
  manual: colours.green,
  match: colours.blue,
  noMatch: colours.green,
  unique: colours.blue
}

const order = {
  matches: 1,
  releases: 2,
  clearanceRequests: 3,
  notifications: 4
}

const keys = {
  releases: ['automatic', 'manual', 'total'],
  matches: ['match', 'noMatch', 'total'],
  clearanceRequests: ['unique', 'total'],
  notifications: ['chedA', 'chedP', 'chedPp', 'chedD', 'total']
}

const dataSetKeys = {
  releases: ['automatic', 'manual'],
  matches: ['match', 'noMatch'],
  clearanceRequests: ['unique'],
  notifications: ['chedA', 'chedP', 'chedPp', 'chedD']
}

const getLevelFigures = (total, matches) => {
  if (total === 0 || Number.isNaN(Number(matches)))
    {return {
      levelMatches: 0,
      levelMatchesPercentage: 0,
      levelNoMatches: 0,
      levelNoMatchesPercentage: 0
    }}

  const levelMatches = Number(matches)
  const levelMatchesPercentage = (levelMatches/total) * 100
  const levelNoMatches = total - levelMatches
  const levelNoMatchesPercentage = ((total - levelMatches) / total) * 100

  return {
    levelMatches,
    levelMatchesPercentage,
    levelNoMatches,
    levelNoMatchesPercentage
  }
}

const mapLevelReport = (reportType, reportHeading, total, levelFigures) => {
  return {
    type: reportType,
    heading: reportHeading,
    tiles: [
      {
        type: 'match',
        label: 'Matches',
        total: levelFigures.levelMatches.toLocaleString('en-GB'),
        percentage: roundValue(levelFigures.levelMatchesPercentage)
      },
      {
        type: 'nomatch',
        label: 'No matches',
        total: levelFigures.levelNoMatches.toLocaleString('en-GB'),
        percentage: roundValue(levelFigures.levelNoMatchesPercentage)
      },
      {
        type: 'total',
        label: 'Total',
        total: total.toLocaleString('en-GB'),
        percentage: null
      }
    ]
  }
}

export const mapReports = (reports, tableHeadings) => {
  const tablesHeader = [{ text: 'Type' }].concat(
    tableHeadings.map((interval) => ({
      text: interval
    }))
  )

  return Object.entries(reports)
    .map(([report, { intervals }]) => {
      const heading = headings[report]
      let total = 0

      const tiles = keys[report]
        .map((type) => {
          total = 0

          return intervals.reduce(
            (tile, { summary }) => {
              tile.total = tile.total + summary[type]

              if (tile.type === 'total') {
                total = tile.total
              }
              return tile
            },
            {
              type,
              label: labels[type],
              total: 0
            }
          )
        })
        .map((tile) => {
          const percentage =
            tile.type === 'total'
              ? null
              : calculatePercentage(tile.total, total)

          return {
            ...tile,
            percentage,
            total: tile.total.toLocaleString('en-GB')
          }
        })

      const charts = dataSetKeys[report].map((type) =>
        intervals.reduce(
          (dataSet, { summary }) => {
            dataSet.data.push(summary[type])
            dataSet.borderColor = lineColours[type]
            return dataSet
          },
          {
            label: labels[type],
            data: []
          }
        )
      )

      const rows = charts.map(({ label, data }) => [
        { text: label },
        ...data.map((value) => ({ text: value }))
      ])

      return {
        heading,
        type: report,
        tiles,
        charts,
        head: tablesHeader,
        rows
      }
    })
    .sort((a, b) => order[a.type] - order[b.type])
}

export const mapMatchingReports = (matchingSummaryLevels) => {
  const total = Number.isNaN(Number(matchingSummaryLevels.total)) ? 0 : Number(matchingSummaryLevels.total)

  const level1Figures = getLevelFigures(total, matchingSummaryLevels.level1)
  const level2Figures = getLevelFigures(total, matchingSummaryLevels.level2)
  const level3Figures = getLevelFigures(total, matchingSummaryLevels.level3)

  const matchingReports = [
    mapLevelReport('level1', 'Level 1 match rates', total, level1Figures),
    mapLevelReport('level2', 'Level 2 match rates', total, level2Figures),
    mapLevelReport('level3', 'Level 3 match rates', total, level3Figures)
  ]

  return matchingReports
}
