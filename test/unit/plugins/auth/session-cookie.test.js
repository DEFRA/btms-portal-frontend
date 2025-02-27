import { validateSession } from '../../../../src/plugins/auth/session-cookie.js'
import { startServer } from '../../../../src/utils/start-server.js'
import { createAuthedUser, setupAuthedUserSession } from '../../utils/session-helper.js'
import { refreshAccessToken } from '../../../../src/plugins/auth/refesh-token.js'
import { removeUserSession, updateUserSession } from '../../../../src/plugins/auth/user-session.js'

jest.mock('../../../../src/plugins/auth/refesh-token.js', () => ({
  refreshAccessToken: jest.fn()
}))

jest.mock('../../../../src/plugins/auth/user-session.js', () => ({
  removeUserSession: jest.fn(),
  updateUserSession: jest.fn()
}))

describe('session-cookie', () => {
  describe('validateSession', () => {
    let server, userSession

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should return not valid if session does not exist', async () => {
      const request = {
        getUserSession: () => {
          return null
        }
      }

      const session = {
        sessionId: 'a-test-session-id'
      }

      const result = await validateSession(server, request, session)

      expect(result.isValid).toBeFalsy()
    })

    test('Should return valid if active session exists', async () => {
      const request = {
        getUserSession: () => {
          return userSession
        }
      }

      const session = {
        sessionId: userSession.sessionId
      }

      const result = await validateSession(server, request, session)

      expect(result.isValid).toBeTruthy()
      expect(result.credentials).toEqual(userSession)
    })

    test('Should return not valid if unable to refresh token', async () => {
      refreshAccessToken.mockReturnValue({
        ok: false
      })
      userSession.expiresAt = new Date().toISOString()

      const request = {
        getUserSession: () => {
          return userSession
        }
      }

      const session = {
        sessionId: userSession.sessionId
      }

      const result = await validateSession(server, request, session)

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(removeUserSession).toHaveBeenCalledTimes(1)
      expect(result.isValid).toBeFalsy()
    })

    test('Should return valid if session token successfully refreshed', async () => {
      const newUserSession = createAuthedUser()
      refreshAccessToken.mockReturnValue({
        ok: true,
        json: () => {
          return newUserSession
        }
      })
      updateUserSession.mockReturnValue(newUserSession)
      userSession.expiresAt = new Date().toISOString()

      const request = {
        getUserSession: () => {
          return userSession
        }
      }

      const session = {
        sessionId: userSession.sessionId
      }

      const result = await validateSession(server, request, session)

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(updateUserSession).toHaveBeenCalledTimes(1)
      expect(result.isValid).toBeTruthy()
      expect(result.credentials).toEqual(newUserSession)
    })
  })
})
