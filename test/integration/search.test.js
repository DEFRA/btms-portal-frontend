import globalJsdom from 'global-jsdom'
import userEvent from '@testing-library/user-event'
import {
  getByRole,
  getByText,
  fireEvent,
  queryByRole
} from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
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

  const searchBox = getByRole(document.body, 'textbox', {
    name: 'Search for an MRN, CHED or GMR'
  })
  expect(searchBox).not.toHaveClass('govuk-input--error')

  expect(queryByRole(document.body, 'button', { name: 'Clear' })).toBe(null)

  fireEvent.keyUp(searchBox, { target: { value: 'test search' } })
  expect(searchBox).toHaveValue('test search')

  const resetButton = getByRole(document.body, 'button', { name: 'Clear' })
  await user.click(resetButton)
  expect(searchBox).toHaveValue('')
  expect(queryByRole(document.body, 'button', { name: 'Clear' })).toBe(null)

  expect(document.querySelectorAll('script[nonce]').length).toBe(2)
  expect(document.title).toBe(
    'Search for an MRN, CHED or GMR - Border Trade Matching Service'
  )
})

test('renders search page with error: no search term', async () => {
  const state = {
    type: 'searchError',
    message: {
      searchTerm: '',
      isValid: false,
      errorCode: 'SEARCH_TERM_REQUIRED'
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
  initSearch()

  const searchBox = getByRole(document.body, 'textbox', {
    name: 'Search for an MRN, CHED or GMR'
  })
  expect(searchBox).toHaveClass('govuk-input--error')
  expect(searchBox).toHaveValue('')

  expect(
    getByText(document.body, 'Enter an MRN, CHED or GMR', {
      exact: false
    })
  ).toBeInTheDocument()
})

test('renders search page with error: invalid search term', async () => {
  const state = {
    type: 'searchError',
    message: {
      searchTerm: 'test search',
      isValid: false,
      errorCode: 'SEARCH_TERM_INVALID'
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
  initSearch()

  const searchBox = getByRole(document.body, 'textbox', {
    name: 'Search for an MRN, CHED or GMR'
  })
  expect(searchBox).toHaveClass('govuk-input--error')
  expect(searchBox).toHaveValue('test search')

  expect(
    getByText(
      document.body,
      'Enter an MRN, CHED or GMR reference in the correct format',
      {
        exact: false
      }
    )
  ).toBeInTheDocument()
})

test('renders search page with error: search term not found', async () => {
  const state = {
    type: 'searchError',
    message: {
      searchTerm: '24GB6T3HFCIZV1HAR9',
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
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
  initSearch()

  const searchBox = getByRole(document.body, 'textbox', {
    name: 'Search for an MRN, CHED or GMR'
  })
  expect(searchBox).toHaveClass('govuk-input--error')
  expect(searchBox).toHaveValue('24GB6T3HFCIZV1HAR9')

  expect(
    getByText(document.body, '24GB6T3HFCIZV1HAR9 cannot be found', {
      exact: false
    })
  ).toBeInTheDocument()
})

test('redirect non authorised requests', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: paths.SEARCH
  })

  expect(statusCode).toBe(302)
})

test.each([
  {
    searchTerm: '',
    expectedSearchError: 'Enter an MRN, CHED or GMR'
  }
])('returns search page if search term is not valid', async (options) => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { result } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?${queryStringParams.SEARCH_TERM}=${options.searchTerm}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(result).toContain(`<span class="govuk-visually-hidden">Error:</span> ${options.expectedSearchError}`)
})

test('redirects to VRN TRN results page if search term is not a valid MRN, CHED, GMR or DUCR format', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?${queryStringParams.SEARCH_TERM}=FOO`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(`${paths.VRN_TRN_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=FOO`)
})

test.each([
  'GMRA00000AB1',
  'gmra00000ab1'
])('redirects to GMR results page if valid GMR search term', async (searchTerm) => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?${queryStringParams.SEARCH_TERM}=${searchTerm}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(`${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm.toUpperCase()}`)
})

test.each([
  '24GB6T3HFCIZV1HAR9',
  '24gb6t3hfcizv1har9',
  'CHEDP.GB.2025.4433124',
  'chedp.gb.2025.4433124',
  'GBCHD2025.4433124',
  'gbchd2025.4433124',
  '4GB335031931000-WB2408-27WWL62745',
  '4gb335031931000-wb2408-27wwl62745'
])('redirects to search results page if valid non GMR search term', async (searchTerm) => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?${queryStringParams.SEARCH_TERM}=${searchTerm}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm.toUpperCase()}`)
})
