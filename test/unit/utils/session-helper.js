import { addSeconds } from 'date-fns'
import iron from '@hapi/iron'
import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'

const authConfig = config.get('auth')
const sessionConfig = config.get('session')

export const setupAuthedUserSession = async (server, expiresAt) => {
  const authedUser = createAuthedUser(expiresAt)

  await server.app.cache.set(authedUser.sessionId, authedUser)

  return authedUser
}

export const createAuthedUser = (expiresAt, strategy) => {
  const expiresInSeconds = sessionConfig.cache.ttl / 1000
  const authedUserProfile = createUserProfile(strategy)
  authedUserProfile.expiresAt = expiresAt ?? authedUserProfile.expiresAt

  const dummyToken = createDummyToken(authedUserProfile, expiresInSeconds)

  return {
    ...authedUserProfile,
    idToken: dummyToken,
    token: dummyToken,
    refreshToken: dummyToken
  }
}

export const createRefreshedToken = () => {
  const authedUserProfile = createUserProfile()

  return createDummyToken(authedUserProfile, sessionConfig.cache.ttl / 1000)
}

function createDummyToken(authedUserProfile, ttl) {
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

function createUserProfile(strategy) {
  const expiresInSeconds = sessionConfig.cache.ttl / 1000
  const expiresInMilliSeconds = sessionConfig.cache.ttl
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  return {
    id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    contactId: crypto.randomUUID(),
    serviceId: authConfig.defraId.serviceId,
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: 'test.user@btms-portal-frontend-unit-test.com',
    uniqueReference: crypto.randomUUID(),
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
    tokenUrl:
      strategy === 'entraId' ? 'https://entraid.foo' : 'https://defraid.foo',
    logoutUrl:
      strategy === 'entraId' ? 'https://entraid.bar' : 'https://defraid.bar',
    strategy: strategy === 'entraId' ? 'entraId' : 'defraId'
  }
}

export const getSessionCookie = async (sessionId) => {
  const password = config.get('session.cookie.password')
  const value = await iron.seal({ sessionId }, password, iron.defaults)
  return `userSession=${value}`
}
