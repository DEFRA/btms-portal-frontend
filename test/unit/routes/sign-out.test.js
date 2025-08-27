import { startServer } from '../../../src/utils/start-server.js'
import { setupAuthedUserSession } from '../utils/session-helper.js'
import { paths } from '../../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'
import {
  getUserSession,
  dropUserSession
} from '../../../src/auth/user-session.js'

jest.mock('../../../src/auth/user-session.js', () => ({
  getUserSession: jest.fn(),
  dropUserSession: jest.fn()
}))

describe('#signOut', () => {
  describe('When accessed with no active session', () => {
    let server

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      getUserSession.mockReturnValue(null)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should redirect to landing page', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'GET',
        url: paths.SIGN_OUT
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(paths.LANDING)
    })
  })

  describe('When accessed with an active session', () => {
    let server, userSession

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
      getUserSession.mockReturnValue(userSession)
      dropUserSession.mockImplementation(() => {
        server.app.cache.drop(userSession.sessionId)
      })
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should redirect to signin provider signOut flow', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'GET',
        url: paths.SIGN_OUT
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(userSession.logoutUrl)
      expect(headers.location).toContain('id_token_hint')
      expect(headers.location).toContain('post_logout_redirect_uri')
    })
  })
})
