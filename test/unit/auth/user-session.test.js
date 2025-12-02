import {
  removeUserSession,
  setUserSession,
  updateUserSession,
  validateUserSession,
  getUserSession,
  dropUserSession
} from '../../../src/auth/user-session.js'
import { startServer } from '../../../src/utils/start-server.js'
import {
  createAuthedUser,
  createRefreshedToken,
  setupAuthedUserSession
} from '../utils/session-helper.js'
import { config } from '../../../src/config/config.js'
import { refreshAccessToken } from '../../../src/auth/refesh-token.js'

const mockCookieAuthClear = jest.fn()

jest.mock('../../../src/auth/refesh-token.js', () => ({
  refreshAccessToken: jest.fn()
}))

const sessionConfig = config.get('session')

describe('#userSession', () => {
  describe('When setting user session', () => {
    let server, authedUser

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      authedUser = createAuthedUser()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should set session in cache', async () => {
      const sessionId = crypto.randomUUID()
      const request = {
        server,
        auth: {
          isAuthenticated: true,
          credentials: {
            ...authedUser
          },
          strategy: 'defraId'
        }
      }

      await setUserSession(request, sessionId)

      const cachedSession = await server.app.cache.get(sessionId)

      expect(cachedSession).not.toBeNull()
      expect(cachedSession.strategy).toBe('defraId')
      expect(cachedSession.expiresIn).toBeGreaterThan(1000)
    })
  })

  describe('When removing user session', () => {
    let server

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should drop and clear the session and cookie', async () => {
      const request = {
        server,
        state: {
          userSession: {
            sessionId: crypto.randomUUID()
          }
        },
        cookieAuth: {
          clear: mockCookieAuthClear
        }
      }

      removeUserSession(request)

      expect(mockCookieAuthClear).toHaveBeenCalledTimes(1)
    })
  })

  describe('When updating user session', () => {
    let server, originalCachedSession, sessionId

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      sessionId = crypto.randomUUID()
      originalCachedSession = await setupAuthedUserSession(server, sessionId)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should replace session in cache', async () => {
      const refreshedToken = createRefreshedToken()

      const request = {
        server,
        state: {
          userSession: {
            sessionId
          }
        }
      }

      const refeshedSession = {
        id_token: refreshedToken,
        access_token: refreshedToken,
        refresh_token: refreshedToken,
        expires_in: sessionConfig.cache.ttl / 1000 + 1 // Make sure the new session doesn't have the same expiry time when the test runs quick
      }

      await updateUserSession(request, refeshedSession)

      const newCachedSession = await server.app.cache.get(sessionId)

      expect(newCachedSession).not.toBeNull()
      expect(newCachedSession.expiresAt).not.toEqual(
        originalCachedSession.expiresAt
      )
    })
  })

  describe('When validating user session', () => {
    let server, userSession, sessionId

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      sessionId = crypto.randomUUID()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should return not valid if session does not exist', async () => {
      const request = {}

      const session = {
        sessionId: 'a-test-session-id'
      }

      const result = await validateUserSession(server, request, session)

      expect(result.isValid).toBeFalsy()
    })

    test('Should return valid if active session exists', async () => {
      userSession = await setupAuthedUserSession(server, sessionId)

      const request = {
        server,
        state: {
          userSession: { sessionId }
        }
      }

      const session = { sessionId }

      const result = await validateUserSession(server, request, session)

      expect(result.isValid).toBeTruthy()
      expect(result.credentials).toEqual(userSession)
    })

    test('Should return not valid if unable to refresh token', async () => {
      refreshAccessToken.mockReturnValue({
        ok: false
      })
      userSession = await setupAuthedUserSession(
        server,
        sessionId,
        new Date().toISOString()
      )

      const request = {
        server,
        state: {
          userSession: {
            sessionId
          }
        },
        cookieAuth: {
          clear: mockCookieAuthClear
        }
      }

      const session = {
        sessionId
      }

      const result = await validateUserSession(server, request, session)

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(mockCookieAuthClear).toHaveBeenCalledTimes(1)
      expect(result.isValid).toBeFalsy()
    })

    test('Should catch errors, boom error, session still valid', async () => {
      refreshAccessToken.mockRejectedValue({
        isBoom: true,
        payload: 'payload',
        output: 'output'
      })
      const expiresAt = new Date().toISOString()
      userSession = await setupAuthedUserSession(server, sessionId, expiresAt)

      const request = {
        server,
        state: {
          userSession: {
            sessionId
          }
        },
        logger: {
          error: jest.fn()
        }
      }

      const session = {
        sessionId
      }

      await validateUserSession(server, request, session)

      expect(request.logger.error.mock.calls).toEqual([
        [
          JSON.stringify({
            message: 'refreshing token',
            sessionId,
            expiresAt,
            payload: 'payload',
            output: 'output'
          })
        ]
      ])
    })

    test('Should catch errors, plain error, no user session', async () => {
      refreshAccessToken.mockRejectedValue({ message: 'boom' })
      userSession = await setupAuthedUserSession(
        server,
        sessionId,
        new Date().toISOString()
      )

      const request = {
        server,
        state: {
          userSession: {
            sessionId
          }
        },
        logger: {
          error: jest.fn()
        }
      }

      const session = {
        sessionId
      }

      await validateUserSession(server, request, session)

      expect(request.logger.error.mock.calls).toEqual([[{ message: 'boom' }]])
    })

    test('Should return valid if session token successfully refreshed', async () => {
      const refreshedToken = createRefreshedToken()

      refreshAccessToken.mockReturnValue({
        ok: true,
        json: {
          id_token: refreshedToken,
          access_token: refreshedToken,
          refresh_token: refreshedToken,
          expires_in: sessionConfig.cache.ttl / 1000
        }
      })
      userSession = await setupAuthedUserSession(
        server,
        sessionId,
        new Date().toISOString()
      )

      const request = {
        server,
        state: {
          userSession: {
            sessionId
          }
        }
      }

      const session = {
        sessionId
      }

      const result = await validateUserSession(server, request, session)

      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(result.isValid).toBeTruthy()
      expect(result.credentials).not.toEqual(userSession)
      expect(result.credentials.expiresAt).not.toEqual(userSession.expiresAt)
    })
  })

  describe('When getting user session', () => {
    let server, userSession, sessionId

    describe('When a session exists', () => {
      beforeEach(async () => {
        server = await startServer()
        sessionId = crypto.randomUUID()
        userSession = await setupAuthedUserSession(server, sessionId)
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should return the cached session', async () => {
        const cachedSession = await server.app.cache.get(sessionId)
        expect(cachedSession).toEqual(userSession)

        const request = {
          server,
          state: {
            userSession: {
              sessionId
            }
          }
        }

        const retrievedSession = await getUserSession(request)

        expect(retrievedSession).toEqual(userSession)
      })
    })

    describe('When request state is not present', () => {
      beforeEach(async () => {
        server = await startServer()
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should return empty session', async () => {
        const request = {
          server
        }

        const retrievedSession = await getUserSession(request)

        expect(retrievedSession).toBeFalsy()
      })
    })

    describe('When a user session is not present', () => {
      beforeEach(async () => {
        server = await startServer()
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should return empty session', async () => {
        const request = {
          server,
          state: {
            userSession: {
              sessionId: crypto.randomUUID()
            }
          }
        }

        const retrievedSession = await getUserSession(request)

        expect(retrievedSession).toBeFalsy()
      })
    })

    describe('When a session does not exist in cache', () => {
      beforeEach(async () => {
        server = await startServer()
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should return null', async () => {
        const request = {
          server,
          state: {
            userSession: {
              sessionId: crypto.randomUUID()
            }
          }
        }

        const retrievedSession = await getUserSession(request)

        expect(retrievedSession).toBeNull()
      })
    })
  })

  describe('When dropping user session', () => {
    let server, userSession, sessionId
    describe('When a session exists in cache', () => {
      beforeEach(async () => {
        server = await startServer()
        sessionId = crypto.randomUUID()
        userSession = await setupAuthedUserSession(server, sessionId)
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should remove the session from cache', async () => {
        let cachedSession

        cachedSession = await server.app.cache.get(sessionId)
        expect(cachedSession).toEqual(userSession)

        const request = {
          server,
          state: {
            userSession: {
              sessionId
            }
          }
        }

        dropUserSession(request)

        cachedSession = await server.app.cache.get(sessionId)
        expect(cachedSession).toBeNull()
      })
    })

    describe('When a session does not exist in cache', () => {
      beforeEach(async () => {
        server = await startServer()
      })

      afterEach(async () => {
        await server.stop({ timeout: 0 })
      })

      test('Should not throw error', async () => {
        const request = {
          server,
          state: {
            userSession: {
              sessionId: crypto.randomUUID()
            }
          }
        }

        await expect(dropUserSession(request)).resolves.not.toThrow()
      })
    })
  })
})
