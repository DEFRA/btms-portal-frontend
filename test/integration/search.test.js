import globalJsdom from 'global-jsdom'
import userEvent from '@testing-library/user-event'
import { getByRole, getByText, fireEvent, queryByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { initSearch } from '../../src/client/javascripts/search.js'

test('renders search page', async () => {
  const user = userEvent.setup()
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SEARCH,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)
  initSearch()

  const searchBox = getByRole(document.body, 'textbox', { name: 'Search by MRN, CHED or DUCR' })
  expect(searchBox)
    .not.toHaveClass('govuk-input--error')

  expect(queryByRole(document.body, 'button', { name: 'Clear' }))
    .toBe(null)

  fireEvent.keyUp(searchBox, { target: { value: 'test search' } })
  expect(searchBox)
    .toHaveValue('test search')

  const resetButton = getByRole(document.body, 'button', { name: 'Clear' })
  await user.click(resetButton)
  expect(searchBox)
    .toHaveValue('')
  expect(queryByRole(document.body, 'button', { name: 'Clear' }))
    .toBe(null)

  expect(document.querySelectorAll('script[nonce]').length)
    .toBe(2)
})

test('renders search page with error', async () => {
  const state = {
    type: 'searchError',
    message: {
      searchTerm: 'test search',
      isValid: false,
      errorCode: 'SEARCH_TERM_INVALID'
    }
  }

  const user = userEvent.setup()
  const server = await initialiseServer(state)
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SEARCH,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)
  initSearch()

  const searchBox = getByRole(document.body, 'textbox', { name: 'Search by MRN, CHED or DUCR' })
  expect(searchBox)
    .toHaveClass('govuk-input--error')
  expect(searchBox)
    .toHaveValue('test search')
  expect(getByText(document.body, 'You must enter a valid MRN, CHED or DUC', { exact: false }))
    .toBeInTheDocument()

  const resetButton = getByRole(document.body, 'button', { name: 'Clear' })
  await user.click(resetButton)
  expect(searchBox)
    .toHaveValue('')
  expect(queryByRole(document.body, 'button', { name: 'Clear' }))
    .toBe(null)
})

test('rejects non authorised requests', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.SEARCH
  })

  expect(statusCode).toBe(401)
})
