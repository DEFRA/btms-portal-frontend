import { config, configKeys } from '../config/config.js'
import { getUserSession } from './user-session.js'
import { getOpenIdRefreshToken } from './open-id-client.js'
import { paths } from '../routes/route-constants.js'

async function refreshAccessToken (request) {
  const authedUser = await getUserSession(request)
  request.logger.setBindings({ refreshingAccessToken: authedUser.strategy })

  const authConfig = config.get('auth')[authedUser.strategy]
  const refreshToken = authedUser?.refreshToken ?? null
  const clientId = authConfig.clientId
  const clientSecret = authConfig.clientSecret
  const scopes = authConfig.scopes.join(' ')
  const redirectUri = config.get(configKeys.APP_BASE_URL) + paths.AUTH_DEFRA_ID_CALLBACK

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
