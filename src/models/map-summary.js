const calculatePercentage = (part, total) => {
  if (total === 0) {
    return '0.00'
  }
  return ((part / total) * 100).toFixed(2)
}

const headings = {
  releases: 'Releases',
  matches: 'Matches',
  clearanceRequests: 'Unique clearance requests',
  notifications: 'Pre-notifications by CHED type'
}

const labels = {
  automatic: 'Auto',
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

const order = {
  matches: 1,
  releases: 2,
  clearanceRequests: 3,
  notifications: 4
}

const mapTiles = ([key, value], total) => {
  const percentage = key !== 'total' ? calculatePercentage(value, total) : null

  return {
    label: labels[key],
    total: value,
    percentage
  }
}

export const mapSummary = (summary) =>
  Object.entries(summary)
    .map(([key, value]) => {
      const type = key
      const heading = headings[key]
      const tiles = Object.entries(value).map((tile) =>
        mapTiles(tile, value.total)
      )

      return { heading, tiles, type }
    })
    .sort((a, b) => order[a.type] - order[b.type])
