import { v4 as uuidv4 } from 'uuid'
import { startServer } from '../../../../src/utils/start-server.js'
import { setupAuthedUserSession } from '../../utils/session-helper.js'
import { dropUserSession } from '../../../../src/plugins/auth/drop-user-session.js'

describe('#dropUserSession', () => {
  let server, userSession

  describe('When a session exists in cache', () => {
    beforeEach(async () => {
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should remove the session from cache', async () => {
      let cachedSession

      cachedSession = await server.app.cache.get(userSession.sessionId)
      expect(cachedSession).toEqual(userSession)

      const request = {
        server,
        state: {
          userSession: {
            sessionId: userSession.sessionId
          }
        },
        dropUserSession
      }

      request.dropUserSession()

      cachedSession = await server.app.cache.get(userSession.sessionId)
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
            sessionId: uuidv4()
          }
        },
        dropUserSession
      }

      await expect(request.dropUserSession()).resolves.not.toThrowError()
    })
  })
})
