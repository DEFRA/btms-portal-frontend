import { addSeconds } from 'date-fns'
import iron from '@hapi/iron'
import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'
import crypto from 'node:crypto'

const sessionConfig = config.get('session')

export const setupAuthedUserSession = async (server, sessionId= crypto.randomUUID(), expiresAt = undefined) => {
  const authedUser = createAuthedUser(expiresAt)

  await server.app.cache.set(sessionId, authedUser)

  return authedUser
}

export const setupAuthedAdminUserSession = async (server, sessionId= crypto.randomUUID(), expiresAt = undefined) => {
  const authedUser = createAuthedUser(expiresAt)
  authedUser.scope = ['admin']

  await server.app.cache.set(sessionId, authedUser)

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
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  return {
    profile: {
      id: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      email: 'test.user@btms-portal-frontend-unit-test.com',
      uniqueReference: crypto.randomUUID(),
      currentRelationshipId: 1,
      relationships: '1:1:Defra:0:undefined:0',
      roles: '',
      sessionId: crypto.randomUUID(),
    },
    externalSessionId: crypto.randomUUID(),
    expiresIn: expiresInSeconds,
    expiresAt: expiresAt.toISOString(),
    tokenUrl:
      strategy === 'entraId' ? 'https://entraid.foo' : 'https://defraid.foo',
    logoutUrl:
      strategy === 'entraId' ? 'https://entraid.bar' : 'https://defraid.bar',
    provider: strategy === 'entraId' ? 'entraId' : 'defraId'
  }
}

export const getSessionCookie = async (sessionId) => {
  const password = config.get('session.cookie.password')
  const value = await iron.seal({ sessionId }, password, iron.defaults)
  return `userSession=${value}`
}
