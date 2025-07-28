import jwt from '@hapi/jwt'
import { addSeconds, isPast, parseISO, subMinutes } from 'date-fns'
import { refreshAccessToken } from './refesh-token.js'

async function setUserSession (request, sessionId) {
  const { profile } = request.auth.credentials
  const expiresInSeconds = request.auth.credentials.expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  await request.server.app.cache.set(sessionId, {
    ...profile,
    strategy: request.auth.strategy,
    isAuthenticated: request.auth.isAuthenticated,
    token: request.auth.credentials.token,
    refreshToken: request.auth.credentials.refreshToken,
    expiresIn: expiresInMilliSeconds,
    expiresAt: expiresAt.toISOString()
  }, expiresInMilliSeconds)
}

function removeUserSession (request) {
  dropUserSession(request)
  request.cookieAuth.clear()
}

async function updateUserSession (request, refreshedSession) {
  const payload = jwt.token.decode(refreshedSession.access_token).decoded
    .payload

  // Update userSession with new access token and new expiry details
  const expiresInSeconds = refreshedSession.expires_in
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)
  const authedUser = await getUserSession(request)
  const displayName = [payload.firstName, payload.lastName]
    .filter((part) => part)
    .join(' ')

  await request.server.app.cache.set(request.state.userSession.sessionId, {
    ...authedUser,
    id: payload.sub,
    correlationId: payload.correlationId,
    sessionId: payload.sessionId,
    contactId: payload.contactId,
    serviceId: payload.serviceId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    displayName,
    email: payload.email,
    uniqueReference: payload.uniqueReference,
    loa: payload.loa,
    aal: payload.aal,
    enrolmentCount: payload.enrolmentCount,
    enrolmentRequestCount: payload.enrolmentRequestCount,
    currentRelationshipId: payload.currentRelationshipId,
    relationships: payload.relationships,
    roles: payload.roles,
    isAuthenticated: true,
    idToken: refreshedSession.id_token,
    token: refreshedSession.access_token,
    refreshToken: refreshedSession.refresh_token,
    expiresIn: expiresInMilliSeconds,
    expiresAt: expiresAt.toISOString()
  }, expiresInMilliSeconds)

  return getUserSession(request)
}

async function validateUserSession (server, request, session) {
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
      const response = await refreshAccessToken(request)

      if (!response.ok) {
        removeUserSession(request)

        return { isValid: false }
      }

      const refreshAccessTokenJson = await response.json()
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

async function getUserSession (request) {
  return request.state?.userSession?.sessionId
    ? request.server.app.cache.get(request.state.userSession.sessionId)
    : null
}

function dropUserSession (request) {
  return request.server.app.cache.drop(request.state.userSession.sessionId)
}

export { setUserSession, removeUserSession, updateUserSession, validateUserSession, getUserSession, dropUserSession }
