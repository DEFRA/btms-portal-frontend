const filterTypes = {
  declaration: {
    all: ['decision', 'authority', 'match'],
    list: ['decision', 'authority'],
    row: ['match']
  },
  notification: {
    all: ['chedAuthority'],
    list: ['chedAuthority'],
    row: []
  }
}

const resultTypes = {
  declaration: 'items',
  notification: 'commodities'
}

const noResultsInset = (type) => {
  const div = document.createElement('div')
  div.classList.add('govuk-inset-text')
  div.innerText = `There are no ${resultTypes[type]} that match the filters selected.`

  return div
}

const setState = (event) => {
  const { name, value } = event.target

  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.search)

  value ? params.set(name, value) : params.delete(name)

  const newUrl = `${url.pathname}?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
}

const getState = (filterKeys) => {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.search)

  const entries = filterKeys
    .map((key) => [key, params.get(key)])
    .filter(([_, value]) => value)

  return Object.fromEntries(entries)
}

const resetState = (filterKeys) => {
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.search)

  filterKeys.forEach((name) => params.delete(name))

  const newUrl = `${url.pathname}?${params.toString()}`
  window.history.replaceState({}, '', newUrl)
  return {}
}

const clearButton = (state, id) => {
  const button = document.getElementById(id)
  button.hidden = Object.keys(state).length === 0
}

const selects = (state) => {
  Object.entries(state).forEach(([key, value]) => {
    document.getElementById(key).value = value
  })
}

const setEmptyState = (table, type) => {
  const hasVisibleRows = table
    .querySelectorAll('tbody > tr:not([hidden])').length > 0
  const header = table.querySelector('thead')

  if (!hasVisibleRows && header.hidden === false) {
    header.hidden = true
    const inset = noResultsInset(type)
    table.before(inset)
  }
  if (hasVisibleRows && header.hidden === true) {
    table.parentElement.querySelector('.govuk-inset-text').remove()
    header.hidden = false
  }
}

const fixOutcomeWidths = () => {
  [...document.querySelectorAll('.btms-decision-outcomes')]
    .forEach((cell) => { cell.style.width = `${cell.offsetWidth}px` })
}

const setRow = (state, type, row) => {
  const decisionsList = row.querySelector('ul')
  const listItems = [...decisionsList.querySelectorAll('li')]

  listItems.forEach((li) => {
    li.hidden = filterTypes[type].list.some((key) =>
      state[key] && li.dataset[key] !== state[key]
    )
  })

  const rowHidden = filterTypes[type].row.some((key) =>
    state[key] && row.dataset[key] !== state[key]
  )

  row.hidden = Boolean(
    decisionsList.querySelectorAll('li:not([hidden])').length === 0 ||
    rowHidden
  )
}

const setRows = (state, type) => {
  const tables = [...document.querySelectorAll(`table.btms-${type}`)]

  tables.forEach((table) => {
    const rows = [...table.querySelectorAll('tbody tr')]

    rows.forEach((row) => setRow(state, type, row))
    setEmptyState(table, type)
  })
}

const setUpFilters = (type) => {
  const filters = document.getElementById(`${type}-filters`)
  filters.removeAttribute('hidden')
  filters.addEventListener('change', (event) => {
    setState(event)
    const state = getState(filterTypes[type].all)
    clearButton(state, `${type}-reset`)
    setRows(state, type)
  })
  filters.addEventListener('reset', () => {
    const state = resetState(filterTypes[type].all)
    clearButton(state, `${type}-reset`)
    setRows(state, type)
  })

  const initialState = getState(filterTypes[type].all)
  clearButton(initialState, `${type}-reset`)
  selects(initialState)
  setRows(initialState, type)
}

export const initFilters = () => {
  setUpFilters('declaration')
  setUpFilters('notification')
  fixOutcomeWidths()
}
