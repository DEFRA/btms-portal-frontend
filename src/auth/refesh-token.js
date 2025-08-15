import { config } from '../config/config.js'
import { getUserSession } from './user-session.js'
import { getOpenIdRefreshToken } from './open-id-client.js'
import { paths } from '../routes/route-constants.js'

async function refreshAccessToken (request) {
  const authedUser = await getUserSession(request)
  request.logger.setBindings({ refreshingAccessToken: authedUser.strategy })

  const authConfig = config.get('auth')[authedUser.strategy]
  const refreshToken = authedUser.refreshToken
  const clientId = authConfig.clientId
  const clientSecret = authConfig.clientSecret
  const scopes = authConfig.scopes.join(' ')
  const callbackPath = authedUser.strategy === 'defraId'
    ? paths.SIGNIN_DEFRA_ID_CALLBACK
    : paths.SIGNIN_ENTRA_ID_CALLBACK
  const redirectUri = config.get('appBaseUrl') + callbackPath

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: scopes,
    redirect_uri: redirectUri
  }

  return getOpenIdRefreshToken(authedUser.tokenUrl, params)
}

export { refreshAccessToken }
