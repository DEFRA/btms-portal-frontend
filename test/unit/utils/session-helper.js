import { addSeconds } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'

const authConfig = config.get('auth')
const sessionConfig = config.get('session')

export const setupAuthedUserSession = async (server) => {
  const authedUser = createAuthedUser()

  await server.app.cache.set(authedUser.sessionId, authedUser)

  return authedUser
}

export const createAuthedUser = () => {
  const expiresInSeconds = sessionConfig.cache.ttl / 1000
  const authedUserProfile = createUserProfile()

  const dummyToken = createDummyToken(authedUserProfile, expiresInSeconds)

  return {
    ...authedUserProfile,
    idToken: dummyToken,
    token: dummyToken,
    refreshToken: dummyToken
  }
}

export const createRefreshedToken = (sessionId) => {
  const authedUserProfile = createUserProfile(sessionId)

  return createDummyToken(authedUserProfile, sessionConfig.cache.ttl / 1000)
}

function createDummyToken (authedUserProfile, ttl) {
  return jwt.token.generate(
    {
      ...authedUserProfile,
      aud: 'test',
      sub: 'test',
      iss: 'test',
      user: 'Test User'
    },
    {
      key: 'test',
      algorithm: 'HS256'
    },
    {
      ttlSec: ttl
    }
  )
}

function createUserProfile (sessionId) {
  const expiresInSeconds = sessionConfig.cache.ttl / 1000
  const expiresInMilliSeconds = sessionConfig.cache.ttl
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  return {
    id: uuidv4(),
    correlationId: uuidv4(),
    sessionId: sessionId ?? uuidv4(),
    contactId: uuidv4(),
    serviceId: authConfig.defraId.serviceId,
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: 'test.user@btms-portal-frontend-unit-test.com',
    uniqueReference: uuidv4(),
    loa: 1,
    aal: 1,
    enrolmentCount: 1,
    enrolmentRequestCount: 1,
    currentRelationshipId: 1,
    relationships: '1:1:Defra:0:undefined:0',
    roles: '',
    isAuthenticated: true,
    expiresIn: expiresInMilliSeconds,
    expiresAt: expiresAt.toISOString(),
    tokenUrl: 'https://foo',
    logoutUrl: 'https://bar'
  }
}
