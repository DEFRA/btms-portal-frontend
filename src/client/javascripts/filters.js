const filterTypes = {
  declaration: ['decision', 'authority', 'match'],
  notification: ['chedAuthority']
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
  const { searchParams } = new URL(window.location.href)

  const entries = filterKeys
    .map((key) => [key, searchParams.get(key)])
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

const setRow = {
  declaration: (state, row) => {
    row.hidden = filterTypes.declaration.some((key) =>
      state[key] && row.dataset[key] !== state[key]
    )
  },
  notification: (state, row) => {
    const authorityList = row.querySelector('ul')
    const listItems = [...row.querySelectorAll('li')]

    listItems.forEach((li) => {
      li.hidden = filterTypes.notification.some((key) =>
        state[key] && li.dataset[key] !== state[key]
      )
    })

    row.hidden = authorityList
      .querySelectorAll('li:not([hidden])').length === 0
  }
}

const setRows = (state, type) => {
  const tables = [...document.querySelectorAll(`table.btms-${type}`)]

  tables.forEach((table) => {
    const rows = [...table.querySelectorAll('tbody tr')]

    rows.forEach((row) => setRow[type](state, row))
    setEmptyState(table, type)
  })
}

const setUpFilters = (type) => {
  const filtersWrapper = document.getElementById(`${type}-filters-wrapper`)
  filtersWrapper.removeAttribute('hidden')

  const filters = document.getElementById(`${type}-filters`)
  filters.addEventListener('change', (event) => {
    setState(event)
    const state = getState(filterTypes[type])
    clearButton(state, `${type}-reset`)
    setRows(state, type)
  })
  filters.addEventListener('reset', () => {
    const state = resetState(filterTypes[type])
    clearButton(state, `${type}-reset`)
    setRows(state, type)
  })

  const initialState = getState(filterTypes[type])
  clearButton(initialState, `${type}-reset`)
  selects(initialState)
  setRows(initialState, type)
}

export const initFilters = () => {
  setUpFilters('declaration')
  setUpFilters('notification')
}
