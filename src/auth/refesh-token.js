import { createLogger } from '../utils/logger.js'

import { config } from '../config/config.js'
import { getUserSession } from './user-session.js'
import { getDefraIdRefreshToken } from '../services/defraId-client.js'

const authConfig = config.get('auth')
const logger = createLogger()

async function refreshAccessToken (request) {
  const authedUser = await getUserSession(request)
  const refreshToken = authedUser?.refreshToken ?? null
  const clientId = authConfig.defraId.clientId
  const clientSecret = authConfig.defraId.clientSecret

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: `${clientId} openid`
  }

  logger.info('Access token expired, refreshing...')

  return getDefraIdRefreshToken(authedUser.tokenUrl, params)
}

export { refreshAccessToken }
