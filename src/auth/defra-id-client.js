import Wreck from '@hapi/wreck'
import Querystring from 'querystring'
import { constants as httpConstants } from 'http2'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const getDefraIdAuthConfig = async (oidcConfigurationUrl) => {
  const { payload } = await Wreck.get(oidcConfigurationUrl, {
    json: 'strict'
  })

  return payload
}

const getDefraIdRefreshToken = async (refreshUrl, params) => {
  const { res, payload } = await Wreck.post(refreshUrl, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    payload: Querystring.stringify(params)
  })

  if (res.statusCode === httpConstants.HTTP_STATUS_OK) {
    try {
      const jsonResponse = JSON.parse(payload.toString())

      if (jsonResponse?.access_token &&
        jsonResponse?.expires_in &&
        jsonResponse?.id_token &&
        jsonResponse?.refresh_token) {
        return {
          ok: true,
          json: jsonResponse
        }
      }
    } catch (e) {
      logger.error(e, 'Response from Defra ID refresh call contains invalid JSON payload.')
    }
  }

  return { ok: false }
}

export {
  getDefraIdAuthConfig,
  getDefraIdRefreshToken
}
