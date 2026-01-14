import { addSeconds, isPast, parseISO, subMinutes } from 'date-fns'
import { refreshAccessToken } from './refesh-token.js'
import { config } from '../config/config.js'

const sessionCacheTtl = config.get('session.cache.ttl')

async function setUserSession(request, sessionId) {
  const expiresInSeconds = request.auth.credentials.expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  const userSession = {
    ...request.auth.credentials,
    expiresAt: expiresAt.toISOString(),
  }
  userSession.expiresIn = expiresInMilliSeconds

  await request.server.app.cache.set(
    sessionId,
    userSession,
    sessionCacheTtl
  )
}

function removeUserSession(request) {
  dropUserSession(request)
  request.cookieAuth.clear()
}

async function updateUserSession(request, refreshedSession) {
  // Update userSession with new token(s) & expiry details
  const expiresInSeconds = refreshedSession.expires_in
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)
  const authedUser = await getUserSession(request)

  await request.server.app.cache.set(
    request.state.userSession.sessionId,
    {
      ...authedUser,
      idToken: refreshedSession.id_token,
      token: refreshedSession.access_token,
      refreshToken: refreshedSession.refresh_token,
      expiresIn: expiresInMilliSeconds,
      expiresAt: expiresAt.toISOString()
    },
    sessionCacheTtl
  )

  return getUserSession(request)
}

async function validateUserSession(server, request, session) {
  const authedUser = await getUserSession(request)

  if (!authedUser) {
    return { isValid: false }
  }

  const minutesBeforeExpiry = 5
  const tokenIsExpiring = isPast(
    subMinutes(parseISO(authedUser.expiresAt), minutesBeforeExpiry)
  )

  if (tokenIsExpiring) {
    try {
      const response = await refreshAccessToken(request, authedUser)

      if (!response.ok) {
        removeUserSession(request)

        return { isValid: false }
      }

      const refreshAccessTokenJson = await response.json
      const updatedSession = await updateUserSession(
        request,
        refreshAccessTokenJson
      )

      return {
        isValid: true,
        credentials: updatedSession
      }
    } catch (err) {
      const error = err.isBoom
        ? JSON.stringify({
            message: 'refreshing token',
            sessionId: session.sessionId,
            expiresAt: authedUser.expiresAt,
            payload: err.payload,
            output: err.output
          })
        : err

      request.logger.error(error)
    }
  }

  const userSession = await server.app.cache.get(session.sessionId)

  if (userSession) {
    return {
      isValid: true,
      credentials: userSession
    }
  }

  return { isValid: false }
}

async function getUserSession(request) {
  return request.state?.userSession?.sessionId
    ? request.server.app.cache.get(request.state.userSession.sessionId)
    : null
}

function dropUserSession(request) {
  return request.server.app.cache.drop(request.state.userSession.sessionId)
}

export {
  setUserSession,
  removeUserSession,
  updateUserSession,
  validateUserSession,
  getUserSession,
  dropUserSession
}
