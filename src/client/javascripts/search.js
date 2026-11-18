export const initSearch = () => {
  const searchForm = document.getElementById('search')
  const searchInput = document.getElementById('search-term')
  const resetButton = document.getElementById('reset-search')

  resetButton.hidden = searchInput.value === ''

  // 'input' fires for every value change (typing, keyboard or menu paste,
  // cut, drag and drop, autofill), unlike 'keyup' which is keyboard only
  searchInput.addEventListener('input', (event) => {
    resetButton.hidden = event.target.value === ''
  })

  searchForm.addEventListener('reset', () => {
    searchInput.setAttribute('value', '')
    resetButton.hidden = true
  })
}
