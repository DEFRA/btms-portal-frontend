import { v4 as uuidv4 } from 'uuid'
import { startServer } from '../../../src/utils/start-server.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { paths } from '../../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'

jest.mock('uuid', () => ({
  v4: jest.fn()
}))

describe('#signinOidc', () => {
  describe('When accessed following successful signin', () => {
    let server, userSession

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      userSession = createAuthedUser()

      uuidv4.mockReturnValue('a-test-session-id')
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should redirect to search page', async () => {
      const { statusCode, headers, request } = await server.inject({
        method: 'GET',
        url: paths.AUTH,
        auth: {
          strategy: 'defra-id',
          credentials: userSession
        }
      })

      const cachedSession = await request.server.app.cache.get('a-test-session-id')

      expect(cachedSession).not.toBeNull()
      expect(cachedSession.isAuthenticated).toBeTruthy()
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(paths.SEARCH)
      expect(headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('userSession')
        ])
      )
    })
  })
})
