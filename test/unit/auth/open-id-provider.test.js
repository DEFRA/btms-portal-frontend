import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'
import { openIdProvider } from '../../../src/auth/open-id-provider.js'

jest.mock('../../../src/auth/open-id-client.js', () => ({
  getOpenIdConfig: jest.fn().mockReturnValue({
    authorization_endpoint: 'http://some-auth-endpoint/path',
    token_endpoint: 'http://some-token-endpoint/path',
    end_session_endpoint: 'http://some-end-session-endpoint/path'
  })
}))

let provider

beforeAll(async () => {
  provider = await openIdProvider('defraId', {
    oidcConfigurationUrl: 'https://test.it/path'
  })
})

test.each([
  { credentials: null },
  { credentials: {} },
  { credentials: { token: null } }
])('credentials do not exist', async (credentials) => {
  expect(provider.profile(credentials, {}, {})).rejects.toThrow(
    'defraId Auth Access Token not present. Unable to retrieve profile.')
})

test('credentials exist', async () => {
  const currentRelationshipId = 'rel-id-909'
  const organisationId = 'org-id-123'

  config.set('auth.defraId.organisations', [organisationId])

  const token = jwt.token.generate(
    {
      sub: 'testSub',
      correlationId: 'testCorrelationId',
      sessionId: 'testSessionId',
      contactId: 'testContactId',
      serviceId: 'testServiceId',
      firstName: 'Test',
      lastName: 'User',
      email: 'testEmail',
      uniqueReference: 'testUniqueRef',
      loa: 'testLoa',
      aal: 'testAal',
      enrolmentCount: 1,
      enrolmentRequestCount: 1,
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

  const credentials = { token }

  await provider.profile(credentials, { id_token: 'test-id-token' }, {})

  expect(credentials.profile).toEqual({
    id: 'testSub',
    correlationId: 'testCorrelationId',
    sessionId: 'testSessionId',
    contactId: 'testContactId',
    serviceId: 'testServiceId',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: 'testEmail',
    uniqueReference: 'testUniqueRef',
    loa: 'testLoa',
    aal: 'testAal',
    enrolmentCount: 1,
    enrolmentRequestCount: 1,
    currentRelationshipId,
    relationships: [`${currentRelationshipId}:${organisationId}`],
    roles: 'testRoles',
    idToken: 'test-id-token',
    tokenUrl: 'http://some-token-endpoint/path',
    logoutUrl: 'http://some-end-session-endpoint/path'
  })

  expect(config.get('auth.origins'))
    .toEqual([
      'https://test.it',
      'http://some-auth-endpoint',
      'http://some-token-endpoint',
      'http://some-end-session-endpoint'
    ])
})

test('DefraId organisation not allowed', () => {
  config.set('auth.defraId.organisations', ['allowed-org'])

  const token = jwt.token.generate({
    currentRelationshipId: 'rel-1',
    relationships: ['rel1:forbidden-org']
  }, {
    key: 'test',
    algorithm: 'HS256'
  })

  const credentials = {
    provider: 'defraId',
    token
  }

  expect(async () => provider.profile(credentials, {}, {}))
    .rejects.toThrow('organisation not allowed')
})
