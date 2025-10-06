import globalJsdom from 'global-jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import {
  getSessionCookie,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'

test('authenticated', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)
  const cookie = await getSessionCookie(credentials.sessionId)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'link', { name: 'Manage account' })
  ).toBeInTheDocument()
  expect(
    getByRole(document.body, 'link', { name: 'Sign out' })
  ).toBeInTheDocument()
})

test('not authenticated', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  globalJsdom(payload)

  expect(
    queryByRole(document.body, 'link', { name: 'Manage account' })
  ).not.toBeInTheDocument()
  expect(
    queryByRole(document.body, 'link', { name: 'Sign out' })
  ).not.toBeInTheDocument()
})
