import { createLogger } from '../utils/logger.js'

import { config, configKeys } from '../config/config.js'
import { getUserSession } from './user-session.js'
import { getDefraIdRefreshToken } from '../services/defraId-client.js'
import { paths } from '../routes/route-constants.js'

const authConfig = config.get('auth.defraId')
const logger = createLogger()

async function refreshAccessToken (request) {
  const authedUser = await getUserSession(request)
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

  logger.info('Access token expired, refreshing...')

  return await getDefraIdRefreshToken(authedUser.tokenUrl, params)
}

export { refreshAccessToken }
