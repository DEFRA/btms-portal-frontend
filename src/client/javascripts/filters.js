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

const noResultsInset = () => {
  const div = document.createElement('div')
  div.classList.add('govuk-inset-text')
  div.innerText = 'There are no items that match the filters selected.'

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

const setEmptyState = (table) => {
  const hasVisibleRows = table
    .querySelectorAll('tbody > tr:not([hidden])').length > 0
  const header = table.querySelector('thead')

  if (!hasVisibleRows && header.hidden === false) {
    header.hidden = true
    const inset = noResultsInset()
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

const setRow = (state, target, row) => {
  const decisionsList = row.querySelector('ul')
  const listItems = [...decisionsList.querySelectorAll('li')]

  listItems.forEach((li) => {
    li.hidden = filterTypes[target].list.some((key) =>
      state[key] && li.dataset[key] !== state[key]
    )
  })

  const rowHidden = filterTypes[target].row.some((key) =>
    state[key] && row.dataset[key] !== state[key]
  )

  row.hidden = Boolean(
    decisionsList.querySelectorAll('li:not([hidden])').length === 0 ||
    rowHidden
  )
}

const setRows = (state, target) => {
  const tables = [...document.querySelectorAll(`table.btms-${target}`)]

  tables.forEach((table) => {
    const rows = [...table.querySelectorAll('tbody tr')]

    rows.forEach((row) => setRow(state, target, row))
    setEmptyState(table)
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
