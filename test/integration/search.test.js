import globalJsdom from 'global-jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'

test('renders search page', async () => {
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

  expect(getByRole(document.body, 'textbox', { name: 'Search by MRN, CHED or DUCR' }))
    .not.toHaveClass('govuk-input--error')
})

test('renders search page with error', async () => {
  const state = {
    type: 'searchError',
    message: {
      searchTerm: 'test search',
      isValid: false,
      errorCode: 'INVALID_SEARCH_TERM'
    }
  }

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

  expect(getByRole(document.body, 'textbox', { name: 'Search by MRN, CHED or DUCR' }))
    .toHaveClass('govuk-input--error')
  expect(getByText(document.body, 'You must enter a valid MRN, CHED or DUC', { exact: false }))
    .toBeInTheDocument()
})

test('rejects non authorised requests', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.SEARCH
  })

  expect(statusCode).toBe(401)
})
