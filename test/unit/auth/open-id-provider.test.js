import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'
import { openIdProvider } from '../../../src/auth/open-id-provider.js'
import { AUTH_PROVIDERS } from '../../../src/auth/auth-constants.js'

jest.mock('../../../src/auth/open-id-client.js', () => ({
  getOpenIdConfig: jest.fn().mockReturnValue({
    authorization_endpoint: 'http://some-auth-endpoint/path',
    token_endpoint: 'http://some-token-endpoint/path',
    end_session_endpoint: 'http://some-end-session-endpoint/path'
  })
}))

test.each([
  { credentials: null },
  { credentials: {} },
  { credentials: { token: null } }
])('credentials do not exist', async (credentials) => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path'
  })

  expect(provider.profile(credentials, {}, {})).rejects.toThrow(
    'defraId Auth Access Token not present. Unable to retrieve profile.'
  )
})

test('defraId: credentials exist', async () => {
const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path'
  })

  const currentRelationshipId = 'rel-id-909'
  const organisationId = 'org-id-123'

  config.set('auth.defraId.organisations', [organisationId])

  const token = jwt.token.generate(
    {
      sub: 'testSub',
      correlationId: 'testCorrelationId',
      sessionId: 'testSessionId',
      firstName: 'Test',
      lastName: 'User',
      email: 'testEmail',
      uniqueReference: 'testUniqueRef',
      currentRelationshipId,
      relationships: [`${currentRelationshipId}:${organisationId}`],
      roles: 'testRoles',
      aud: 'test',
      iss: 'test',
      user: 'Test User'
    },
    {
      key: 'test',
      algorithm: 'HS256'
    },
    {
      ttlSec: 1
    }
  )

  const credentials = { provider: 'defraId', token }

  await provider.profile(credentials, { id_token: 'test-id-token' }, {})

  expect(credentials.externalSessionId).toEqual('testSessionId')
  expect(credentials.idToken).toBeUndefined()
  expect(credentials.logoutUrl).toEqual('http://some-end-session-endpoint/path')
  expect(credentials.profile).toEqual({
    id: 'testSub',
    correlationId: 'testCorrelationId',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: 'testEmail',
    uniqueReference: 'testUniqueRef',
    currentRelationshipId,
    relationships: [`${currentRelationshipId}:${organisationId}`],
    roles: 'testRoles'
  })
  expect(credentials.tokenUrl).toEqual('http://some-token-endpoint/path')

  expect(config.get('auth.origins')).toEqual([
    'https://test.it',
    'http://some-auth-endpoint',
    'http://some-token-endpoint',
    'http://some-end-session-endpoint'
  ])
})

test('defraId: organisation not allowed', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path'
  })

  config.set('auth.defraId.organisations', ['allowed-org'])

  const token = jwt.token.generate(
    {
      currentRelationshipId: 'rel-1',
      relationships: ['rel1:forbidden-org']
    },
    {
      key: 'test',
      algorithm: 'HS256'
    }
  )

  const credentials = {
    provider: 'defraId',
    token
  }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    'organisation not allowed'
  )
})

test('entraId: credentials exist', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.ENTRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path'
  })
  const adminGroupId = 'test-admin-group-id'
  const anotherGroupId = 'test-group-id'
  config.set('auth.entraId.adminGroupId', adminGroupId)
  config.set('auth.entraId.groups', [adminGroupId, anotherGroupId])

  const token = jwt.token.generate(
    {
      sub: 'testSub',
      sid: 'testSessionId',
      name: 'Entra Test User',
      email: 'testEmail',
      aud: 'test',
      iss: 'test',
    },
    {
      key: 'test',
      algorithm: 'HS256'
    },
    {
      ttlSec: 1
    }
  )

  const idToken = jwt.token.generate(
    {
      aud: 'test',
      iss: "https://login.microsoftonline.com/test/v2.0",
      iat: 1765543445,
      nbf: 1765543445,
      exp: 1765547345,
      groups: [
        adminGroupId,
        anotherGroupId
      ],
      sub: 'testSub',
      ver: "2.0"
    },
    {
      key: 'test',
      algorithm: 'HS256'
    },
    {
      ttlSec: 1
    }
  )

  const credentials = { provider: AUTH_PROVIDERS.ENTRA_ID, token }

  await provider.profile(credentials, { id_token: idToken }, {})

  expect(credentials.externalSessionId).toEqual('testSessionId')
  expect(credentials.logoutUrl).toEqual('http://some-end-session-endpoint/path')
  expect(credentials.profile).toEqual({
    id: 'testSub',
    displayName: 'Entra Test User',
    email: 'testEmail'
  })
  expect(credentials.scope).toEqual(['admin'])
  expect(credentials.tokenUrl).toEqual('http://some-token-endpoint/path')
})

test('entraId: group not allowed', async () => {
const provider = await openIdProvider(AUTH_PROVIDERS.ENTRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path'
  })

  const token = jwt.token.generate(
    {},
    {
      key: 'test',
      algorithm: 'HS256'
    }
  )
  const idToken = jwt.token.generate(
    {
      groups: ['disallowed-group']
    },
    {
      key: 'test',
      algorithm: 'HS256'
    }
  )

  const credentials = {
    provider: 'entraId',
    token
  }
  const params = {
    id_token: idToken
  }

  expect(async () => provider.profile(credentials, params, {})).rejects.toThrow(
    'group not allowed'
  )
})
