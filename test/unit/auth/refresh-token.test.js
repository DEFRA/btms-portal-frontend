import { refreshAccessToken } from '../../../src/auth/refesh-token.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { config, configKeys } from '../../../src/config/config.js'
import { getUserSession } from '../../../src/auth/user-session.js'
import { paths } from '../../../src/routes/route-constants.js'

const mockGetOpenIdRefreshToken = jest.fn()

const authConfig = config.get('auth')

jest.mock('../../../src/auth/open-id-client.js', () => ({
  getOpenIdRefreshToken: (...args) => mockGetOpenIdRefreshToken(...args)
}))

jest.mock('../../../src/auth/user-session.js', () => ({
  getUserSession: jest.fn()
}))

describe('#refreshToken', () => {
  describe('When a request to refresh a token is received', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
    })

    test('Should call refresh endpoint for a new token', async () => {
      const authedUser = createAuthedUser()
      const clientId = authConfig.defraId.clientId
      const clientSecret = authConfig.defraId.clientSecret
      const redirectUri = config.get(configKeys.APP_BASE_URL) + paths.AUTH_DEFRA_ID_CALLBACK

      getUserSession.mockReturnValue(authedUser)

      const request = {
        logger: {
          setBindings: jest.fn()
        }
      }

      await refreshAccessToken(request)

      expect(mockGetOpenIdRefreshToken).toHaveBeenCalledTimes(1)
      expect(mockGetOpenIdRefreshToken).toHaveBeenCalledWith(authedUser.tokenUrl, expect.objectContaining({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: authedUser.refreshToken,
        scope: 'openid offline_access',
        redirect_uri: redirectUri
      }))
    })
  })
})
