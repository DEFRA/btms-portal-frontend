import { refreshAccessToken } from '../../../src/auth/refesh-token.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { createLogger } from '../../../src/utils/logger.js'
import { config } from '../../../src/config/config.js'
import { getUserSession } from '../../../src/auth/user-session.js'

const mockGetDefraIdRefreshToken = jest.fn()
const mockLoggerInfo = jest.fn()

const authConfig = config.get('auth')

jest.mock('../../../src/services/defraId-client.js', () => ({
  getDefraIdRefreshToken: (...args) => mockGetDefraIdRefreshToken(...args)
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
        logger
      }

      await refreshAccessToken(request)

      expect(mockGetDefraIdRefreshToken).toHaveBeenCalledTimes(1)
      expect(mockGetDefraIdRefreshToken).toHaveBeenCalledWith(authedUser.tokenUrl, expect.objectContaining({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: authedUser.refreshToken,
        scope: `${clientId} openid`
      }))
    })
  })
})
