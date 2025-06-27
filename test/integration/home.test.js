import globalJsdom from 'global-jsdom'
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
  expect(document.querySelectorAll('script[nonce]').length)
    .toBe(1)
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

  expect(headers.location)
    .toBe('/search')
})
