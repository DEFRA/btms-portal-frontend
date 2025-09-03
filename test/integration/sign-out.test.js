import { paths } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'
import { initialiseServer } from '../utils/initialise-server.js'
import {
  getSessionCookie,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'

test('active user session', async () => {
  const server = await initialiseServer(null, true)
  const credentials = await setupAuthedUserSession(server)
  const cookie = await getSessionCookie(credentials.sessionId)

  const { isAuthenticated } = await server.app.cache.get(credentials.sessionId)
  expect(isAuthenticated).toBe(true)

  const { headers, statusCode } = await server.inject({
    method: 'get',
    url: paths.SIGN_OUT,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })

  const expectedLocation = `${credentials.logoutUrl}?id_token_hint=${
    credentials.idToken
  }&post_logout_redirect_uri=${config.get('appBaseUrl')}${
    paths.SIGNED_OUT
  }?provider=${credentials.strategy}`

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(expectedLocation)
  expect(await server.app.cache.get(credentials.sessionId)).toBe(null)

  const [setCookie] = headers['set-cookie']
  const [name, age] = setCookie.split(';')

  expect(name.trim()).toBe('userSession=')
  expect(age.trim()).toBe('Max-Age=0')

  await server.stop()
})

test('no active user session', async () => {
  const server = await initialiseServer()

  const { headers, statusCode } = await server.inject({
    method: 'get',
    url: paths.SIGN_OUT
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/')
})
