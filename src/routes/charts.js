const getRandomInt = (max) => Math.floor(Math.random() * max)

const getRandomIntInRange = (prev, range, max) => {
  const min = Math.max(0, prev - range)
  const maxNext = Math.min(max, prev + range)
  return Math.floor(Math.random() * (maxNext - min + 1)) + min
}

const labels = [...new Array(24)].map(
  (_, i) => `${String(i).padStart(2, '0')}:00`
)

const getChartData = () => {
  let prevMatch = getRandomInt(250)
  let totalMatches = prevMatch
  const matches = [...new Array(24)].map(() => {
    const next = getRandomIntInRange(prevMatch, 20, 250)
    prevMatch = next
    totalMatches += next
    return next
  })

  let prevNoMatch = getRandomInt(15)
  let totalNoMatches = prevNoMatch
  const noMatches = [...new Array(24)].map(() => {
    const next = getRandomIntInRange(prevNoMatch, 3, 15)
    prevNoMatch = next
    totalNoMatches += next
    return next
  })

  return {
    totalMatches,
    totalNoMatches,
    total: totalMatches + totalNoMatches,
    datasets: [
      {
        label: 'match',
        data: matches
      },
      {
        label: 'no match',
        data: noMatches
      }
    ]
  }
}

const getTableData = (datasets) => {
  const head = [{ text: '' }, ...labels.map((label) => ({ text: label }))]

  const rows = datasets.map((ds) => [
    { text: ds.label },
    ...ds.data.map((val) => ({ text: val }))
  ])

  return { head, rows }
}

function renderData(obj, indent = 2) {
  const seen = new WeakSet()

  function _format(value, level = 0) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value)
    }

    if (Array.isArray(value)) {
      // ✅ Inline if all elements are primitives
      const allPrimitives = value.every(
        (el) =>
          el === null ||
          typeof el === 'string' ||
          typeof el === 'number' ||
          typeof el === 'boolean'
      )

      if (allPrimitives) {
        return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`
      }

      // Otherwise expand nested arrays/objects
      const inner = value
        .map((el) => _format(el, level + 1))
        .join(',\n' + ' '.repeat((level + 1) * indent))
      return `[\n${' '.repeat((level + 1) * indent)}${inner}\n${' '.repeat(
        level * indent
      )}]`
    }

    if (seen.has(value)) {
      return '"[Circular]"'
    }
    seen.add(value)

    const entries = Object.entries(value).map(
      ([k, v]) => `${JSON.stringify(k)}: ${_format(v, level + 1)}`
    )

    return `{\n${' '.repeat((level + 1) * indent)}${entries.join(
      ',\n' + ' '.repeat((level + 1) * indent)
    )}\n${' '.repeat(level * indent)}}`
  }

  return _format(obj, 0)
}

export const charts = {
  method: 'get',
  path: '/charts',
  handler: (_, h) => {
    const chartData = getChartData()
    const table = getTableData(chartData.datasets)
    const data = { labels, ...chartData }
    const raw = renderData(data)
    return h.view('charts', {
      data,
      table,
      raw
    })
  }
}
