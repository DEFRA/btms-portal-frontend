import { supplyProfileFunc } from '../../../../../src/plugins/auth/utils/profile-provider.js'
import expect from 'expect'
import jwt from '@hapi/jwt'

describe('#supplyProfileFunc', () => {
  let populateProfileFunc

  beforeAll(async () => {
    populateProfileFunc = await supplyProfileFunc({
      token_endpoint: 'http://some-token-endpoint',
      end_session_endpoint: 'http://some-end-session-endpoint'
    })
  })

  test.each([
    { credentials: null },
    { credentials: {} },
    { credentials: { token: null } }
  ])('When credentials do not exist', async (credentials) => {
    expect(populateProfileFunc(credentials, {}, {})).rejects.toThrow('Defra ID Auth Access Token not present. Unable to retrieve profile.')
  })

  test('When credentials exist', async () => {
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
        currentRelationshipId: 'testRelationshipId',
        relationships: 'testRelationships',
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

    const credentials = {
      token: token
    }

    await populateProfileFunc(credentials, { id_token: 'test-id-token' }, {})

    expect(credentials.profile).not.toBeNull()
    expect(credentials.profile).toEqual(expect.objectContaining({
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
      currentRelationshipId: 'testRelationshipId',
      relationships: 'testRelationships',
      roles: 'testRoles',
      idToken: 'test-id-token',
      tokenUrl: 'http://some-token-endpoint',
      logoutUrl: 'http://some-end-session-endpoint'
    }))
  })
})
