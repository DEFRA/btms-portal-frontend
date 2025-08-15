import querystring from 'node:querystring'
import wreck from '@hapi/wreck'
import { constants } from 'http2'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const getOpenIdConfig = async (oidcConfigurationUrl) => {
  const { payload } = await wreck.get(oidcConfigurationUrl, {
    json: 'strict'
  })

  return payload
}

const getOpenIdRefreshToken = async (refreshUrl, params) => {
  try {
    const { res, payload } = await wreck.post(refreshUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      payload: querystring.stringify(params)
    })

    if (res.statusCode === constants.HTTP_STATUS_OK) {
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
    }
  } catch (err) {
    logger.error(err.data?.payload?.toString() || err)
  }

  return { ok: false }
}

export {
  getOpenIdConfig,
  getOpenIdRefreshToken
}
