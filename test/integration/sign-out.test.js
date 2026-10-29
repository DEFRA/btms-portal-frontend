import { paths } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'
import { initialiseServer } from '../utils/initialise-server.js'
import {
  getSessionCookie,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'

test('active user session', async () => {
  const server = await initialiseServer(null, true)
  const sessionId = crypto.randomUUID()
  const credentials = await setupAuthedUserSession(server, sessionId)
  const cookie = await getSessionCookie(sessionId)

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
  }?provider=${credentials.provider}`

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(expectedLocation)
  expect(await server.app.cache.get(sessionId)).toBe(null)

  expect(headers['set-cookie']).toEqual(
    expect.arrayContaining([
      expect.stringContaining('userSession=; Max-Age=0'),
      expect.stringContaining('crumb=')
    ])
  )

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

test('user with no session is sent to the provider end session endpoint', async () => {
  const server = await initialiseServer()
  const { origin } = new URL(config.get('auth.entraId.oidcConfigurationUrl'))

  const { headers, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.SIGN_OUT}?provider=entraId`
  })

  expect(statusCode).toBe(302)
  expect(headers.location.startsWith(origin)).toBe(true)
  expect(headers.location).toContain(
    `post_logout_redirect_uri=${config.get('appBaseUrl')}${paths.SIGNED_OUT}?provider=entraId`
  )

  expect(headers['set-cookie']).toEqual(
    expect.arrayContaining([
      expect.stringContaining('userSession=; Max-Age=0'),
      expect.stringContaining('crumb=')
    ])
  )
})

test.each(['notAProvider', 'constructor', '__proto__'])(
  'user with no session and an unknown provider (%s) is sent to the landing page',
  async (provider) => {
    const server = await initialiseServer()

    const { headers, statusCode } = await server.inject({
      method: 'get',
      url: `${paths.SIGN_OUT}?provider=${provider}`
    })

    expect(statusCode).toBe(302)
    expect(headers.location).toBe(paths.LANDING)
  }
)
