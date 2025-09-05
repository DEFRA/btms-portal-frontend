const getRandomInt = (max) => Math.floor(Math.random() * max)

const getRandomIntInRange = (prev, range, max) => {
  const min = Math.max(0, prev - range)
  const maxNext = Math.min(max, prev + range)
  return Math.floor(Math.random() * (maxNext - min + 1)) + min
}

const labels = [...new Array(24)].map(
  (_, i) => `${String(i).padStart(2, '0')}:00`
)

const getDataSet = (max, range) => {
  let prev = getRandomInt(max)
  let total = prev

  const data = [...new Array(24)].map(() => {
    const curr = getRandomIntInRange(prev, range, max)
    prev = curr
    total += curr
    return curr
  })

  return { total, data }
}

const getChartData = () => {
  const matches = {
    label: 'match',
    ...getDataSet(250, 20),
    borderColor: '#5694CA',
    backgroundColor: '#5694CA'
  }

  const noMatches = {
    label: 'no match',
    ...getDataSet(25, 3),
    borderColor: '#2BA8A3',
    backgroundColor: '#2BA8A3'
  }

  const autoReleases = {
    label: 'automatic',
    ...getDataSet(275, 30),
    borderColor: '#5694CA',
    backgroundColor: '#5694CA'
  }

  const manualReleases = {
    label: 'manual',
    ...getDataSet(30, 4),
    borderColor: '#2BA8A3',
    backgroundColor: '#2BA8A3'
  }

  return {
    matches,
    noMatches,
    autoReleases,
    manualReleases
  }
}

const getRows = (datasets) => datasets.map(
  (dataset) => [
    { text: dataset.label },
    ...dataset.data.map((val) => ({ text: val }))
  ]
)

const getTableData = (datasets) => {
  const head = [{ text: '' }, ...labels.map((label) => ({ text: label }))]

  const matchAndNoMatch = getRows([datasets.matches, datasets.noMatches])

  return { head, matchAndNoMatch }
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
    const table = getTableData(chartData)
    const data = { labels, ...chartData }
    const raw = renderData(data)
    return h.view('charts', {
      data,
      table,
      raw
    })
  }
}
