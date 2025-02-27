import { v4 as uuidv4 } from 'uuid'
import { startServer } from '../../../../src/utils/start-server.js'
import { setupAuthedUserSession } from '../../utils/session-helper.js'
import { getUserSession } from '../../../../src/plugins/auth/get-user-session.js'

describe('#getUserSession', () => {
  let server, userSession

  describe('When a session exists', () => {
    beforeEach(async () => {
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should return the cached session', async () => {
      const cachedSession = await server.app.cache.get(userSession.sessionId)
      expect(cachedSession).toEqual(userSession)

      const request = {
        server,
        state: {
          userSession: {
            sessionId: userSession.sessionId
          }
        },
        getUserSession
      }

      const retrievedSession = await request.getUserSession()

      expect(retrievedSession).toEqual(userSession)
    })
  })

  describe('When request state is not present', () => {
    beforeEach(async () => {
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should return empty session', async () => {
      const cachedSession = await server.app.cache.get(userSession.sessionId)
      expect(cachedSession).toEqual(userSession)

      const request = {
        server,
        getUserSession
      }

      const retrievedSession = await request.getUserSession()

      expect(retrievedSession).toEqual({})
    })
  })

  describe('When a user session is not present', () => {
    beforeEach(async () => {
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should return empty session', async () => {
      const cachedSession = await server.app.cache.get(userSession.sessionId)
      expect(cachedSession).toEqual(userSession)

      const request = {
        server,
        state: {},
        getUserSession
      }

      const retrievedSession = await request.getUserSession()

      expect(retrievedSession).toEqual({})
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
            sessionId: uuidv4()
          }
        },
        getUserSession
      }

      const retrievedSession = await request.getUserSession()

      expect(retrievedSession).toBeNull()
    })
  })
})
