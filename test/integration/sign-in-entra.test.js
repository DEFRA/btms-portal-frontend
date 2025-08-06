import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'

const { oidcConfigurationUrl } = config.get('auth.entraId')

test('user not signed in', async () => {
  const server = await initialiseServer()

  const { headers, statusCode } = await server.inject({
    method: 'get',
    url: paths.SIGN_IN_ENTRA
  })

  const actualURL = new URL(headers.location)
  const expectedURL = new URL(oidcConfigurationUrl)

  expect(statusCode).toBe(302)
  expect(actualURL.origin).toBe(expectedURL.origin)
})

test('user signed in', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { headers, statusCode } = await server.inject({
    method: 'get',
    auth: {
      strategy: 'session',
      credentials
    },
    url: paths.SIGN_IN_ENTRA
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/search')
})
