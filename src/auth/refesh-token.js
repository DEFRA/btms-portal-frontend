import { createLogger } from '../utils/logger.js'

import { config, configKeys } from '../config/config.js'
import { getUserSession } from './user-session.js'
import { getDefraIdRefreshToken } from './defra-id-client.js'
import { paths } from '../routes/route-constants.js'
import { getEntraIdRefreshToken } from './entra-id-client.js'

const logger = createLogger()

async function refreshAccessToken (request) {
  const authedUser = await getUserSession(request)
  const refreshToken = authedUser?.refreshToken ?? null

  const authConfig = authedUser.internal ? config.get('auth.entraId') : config.get('auth.defraId')

  const clientId = authConfig.clientId
  const clientSecret = authConfig.clientSecret
  const scopes = authConfig.scopes.join(' ')
  const redirectUri = authedUser.internal
    ? config.get(configKeys.APP_BASE_URL) + paths.AUTH_ENTRA_ID_CALLBACK
    : config.get(configKeys.APP_BASE_URL) + paths.AUTH_DEFRA_ID_CALLBACK

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: scopes,
    redirect_uri: redirectUri
  }

  logger.info('Access token expired, refreshing...')

  // Check if internal or external user and call relevant refresh function
  return authedUser.internal
    ? getEntraIdRefreshToken(authedUser.tokenUrl, params)
    : getDefraIdRefreshToken(authedUser.tokenUrl, params)
}

export { refreshAccessToken }
