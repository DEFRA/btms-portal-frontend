import Wreck from '@hapi/wreck'
import Querystring from 'querystring'

import { config } from '../../config/config.js'

const authConfig = config.get('auth')

async function refreshAccessToken (request) {
  const authedUser = await request.getUserSession()
  const refreshToken = authedUser?.refreshToken ?? null
  const clientId = authConfig.defraId.clientId
  const clientSecret = authConfig.defraId.clientSecret

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: `${clientId} openid offline_access`
  }

  request.logger.info('Access token expired, refreshing...')

  return Wreck.post(authedUser.tokenUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    payload: Querystring.stringify(params)
  })
}

export { refreshAccessToken }
