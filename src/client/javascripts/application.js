import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'
import { initFilters } from './filters.js'
import { initSearch } from './search.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

window.BTMS = window.BTMS || {}
window.BTMS = {
  ...window.BTMS,
  initFilters,
  initSearch
}
