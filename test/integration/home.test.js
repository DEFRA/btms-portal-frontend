import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'

test('not authenticated', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/sign-in-choose'
  )

  expect(document.querySelectorAll('script[nonce]').length).toBe(1)

  expect(document.title).toBe(
    'Border Trade Matching Service - Border Trade Matching Service'
  )
})

test('authenticated', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { headers } = await server.inject({
    method: 'get',
    url: paths.LANDING,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(headers.location).toBe('/search')
})

test('footer links', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'link', { name: 'Accessibility statement' })
  ).toHaveAttribute('href', '/accessibility-statement')

  expect(getByRole(document.body, 'link', { name: 'Cookies' })).toHaveAttribute(
    'href',
    '/cookies'
  )
})
