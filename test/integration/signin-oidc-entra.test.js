import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'

const { oidcConfigurationUrl } = config.get('auth.entraId')

test('redirects to search when authenticated', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { headers, statusCode } = await server.inject({
    method: 'post',
    url: paths.SIGNIN_ENTRA_ID_CALLBACK,
    auth: {
      strategy: 'entraId',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/search')
})

test('redirects to auth provider when not authenticated', async () => {
  const server = await initialiseServer()

  const { headers, statusCode } = await server.inject({
    method: 'post',
    url: paths.SIGNIN_ENTRA_ID_CALLBACK
  })

  expect(statusCode).toBe(302)

  const actualURL = new URL(headers.location)
  const expectedUrl = new URL(oidcConfigurationUrl)

  expect(actualURL.origin).toBe(expectedUrl.origin)
})
