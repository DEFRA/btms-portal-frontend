import { startServer } from '../../../src/utils/start-server.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { paths } from '../../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'

describe('#signIn', () => {
  describe('When accessed following successful signin', () => {
    let server, userSession

    beforeEach(async () => {
      server = await startServer()
      userSession = createAuthedUser()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should redirect to search page', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'GET',
        url: paths.SIGN_IN,
        auth: {
          strategy: 'defraId',
          credentials: userSession
        }
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(paths.SEARCH)
    })
  })
})
