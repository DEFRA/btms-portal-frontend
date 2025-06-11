export const initSearch = () => {
  const searchForm = document.getElementById('search')
  const searchInput = document.getElementById('search-term')
  const resetButton = document.getElementById('reset-search')

  resetButton.hidden = searchInput.value === ''

  searchInput.addEventListener('keyup', (event) => {
    resetButton.hidden = event.target.value === ''
  })

  searchForm.addEventListener('reset', () => {
    searchInput.setAttribute('value', '')
    resetButton.hidden = true
  })
}
