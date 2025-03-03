import { refreshAccessToken } from '../../../src/auth/refesh-token.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { createLogger } from '../../../src/utils/logger.js'
import Querystring from 'querystring'
import { config } from '../../../src/config/config.js'
import { getUserSession } from '../../../src/auth/user-session.js'

const mockPost = jest.fn()
const mockLoggerInfo = jest.fn()

const authConfig = config.get('auth')

jest.mock('@hapi/wreck', () => ({
  post: (...args) => mockPost(...args)
}))

jest.mock('../../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args)
  })
}))

jest.mock('../../../src/auth/user-session.js', () => ({
  getUserSession: jest.fn()
}))

describe('#refreshToken', () => {
  describe('When a request to refresh a token is received', () => {
    let logger

    beforeEach(async () => {
      jest.clearAllMocks()
      logger = createLogger()
    })

    test('Should call refresh endpoint for a new token', async () => {
      const authedUser = createAuthedUser()
      const clientId = authConfig.defraId.clientId
      const clientSecret = authConfig.defraId.clientSecret

      getUserSession.mockReturnValue(authedUser)

      const request = {
        logger: logger
      }

      const expectedPayload = Querystring.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: authedUser.refreshToken,
        scope: `${clientId} openid`
      })

      await refreshAccessToken(request)

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith(authedUser.tokenUrl, expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        payload: expectedPayload
      }))
    })
  })
})
