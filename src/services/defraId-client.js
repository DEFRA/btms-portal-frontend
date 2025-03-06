import Wreck from '@hapi/wreck'
import Querystring from 'querystring'

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

  if (res.statusCode === 200) {
    const jsonResponse = JSON.parse(payload.toString())

    if (jsonResponse) {
      return {
        ok: true,
        json: jsonResponse
      }
    }
  }

  return { ok: false }
}

export {
  getDefraIdAuthConfig,
  getDefraIdRefreshToken
}
