import { refreshAccessToken } from '../../../src/auth/refesh-token.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { config } from '../../../src/config/config.js'
import { paths } from '../../../src/routes/route-constants.js'

const mockGetOpenIdRefreshToken = jest.fn()

const authConfig = config.get('auth')

jest.mock('../../../src/auth/open-id-client.js', () => ({
  getOpenIdRefreshToken: (...args) => mockGetOpenIdRefreshToken(...args)
}))

test('refreshes user signed in with DefraId', async () => {
  const authedUser = createAuthedUser()
  const clientId = authConfig.defraId.clientId
  const clientSecret = authConfig.defraId.clientSecret
  const redirectUri = config.get('appBaseUrl') + paths.SIGNIN_DEFRA_ID_CALLBACK

  await refreshAccessToken({}, authedUser)

  expect(mockGetOpenIdRefreshToken.mock.calls).toEqual([
    [
      authedUser.tokenUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: authedUser.refreshToken,
        scope: 'openid offline_access',
        redirect_uri: redirectUri
      }
    ]
  ])
})

test('refreshes user signed in with EntraId', async () => {
  const authedUser = createAuthedUser(null, 'entraId')
  const clientId = authConfig.entraId.clientId
  const clientSecret = authConfig.entraId.clientSecret
  const redirectUri = config.get('appBaseUrl') + paths.SIGNIN_ENTRA_ID_CALLBACK

  await refreshAccessToken({}, authedUser)

  expect(mockGetOpenIdRefreshToken.mock.calls).toEqual([
    [
      authedUser.tokenUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: authedUser.refreshToken,
        scope: 'openid offline_access',
        redirect_uri: redirectUri
      }
    ]
  ])
})

test('logs missing if refresh token missing', async () => {
  const { refreshToken, ...authedUser } = createAuthedUser()
  const request = { logger: { error: jest.fn() } }
  const expected = await refreshAccessToken(request, authedUser)

  expect(request.logger.error.mock.calls).toEqual([
    ['missing defraId refresh token']
  ])
  expect(expected).toEqual({})
})
