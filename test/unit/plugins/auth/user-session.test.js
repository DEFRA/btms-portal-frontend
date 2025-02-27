import { removeUserSession, updateUserSession } from '../../../../src/plugins/auth/user-session.js'
import { startServer } from '../../../../src/utils/start-server.js'
import { createRefreshedToken, setupAuthedUserSession } from '../../utils/session-helper.js'
import { getUserSession } from '../../../../src/plugins/auth/get-user-session.js'
import { config } from '../../../../src/config/config.js'

const mockDropUserSession = jest.fn()
const mockCookieAuthClear = jest.fn()

const sessionConfig = config.get('session')

describe('#userSession', () => {
  describe('When removing user session', () => {
    test('Should drop and clear the session and cookie', async () => {
      const request = {
        dropUserSession: mockDropUserSession,
        cookieAuth: {
          clear: mockCookieAuthClear
        }
      }

      removeUserSession(request)

      expect(mockDropUserSession).toHaveBeenCalledTimes(1)
      expect(mockCookieAuthClear).toHaveBeenCalledTimes(1)
    })
  })

  describe('When updating user session', () => {
    let server, originalCachedSession

    beforeEach(async () => {
      server = await startServer()
      originalCachedSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should replace session in cache', async () => {
      const refreshedToken = createRefreshedToken()

      const request = {
        getUserSession: getUserSession,
        server: server,
        state: {
          userSession: {
            sessionId: originalCachedSession.sessionId
          }
        }
      }

      const refeshedSession = {
        id_token: refreshedToken,
        access_token: refreshedToken,
        refresh_token: refreshedToken,
        expires_in: sessionConfig.cache.ttl / 1000
      }

      await updateUserSession(request, refeshedSession)

      const newCachedSession = await server.app.cache.get(originalCachedSession.sessionId)

      expect(newCachedSession).not.toBeNull()
      expect(newCachedSession.expiresAt).not.toEqual(originalCachedSession.expiresAt)
    })
  })
})
