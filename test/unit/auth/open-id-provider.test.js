import jwt from '@hapi/jwt'
import { config } from '../../../src/config/config.js'
import { openIdProvider } from '../../../src/auth/open-id-provider.js'
import { AUTH_PROVIDERS } from '../../../src/auth/auth-constants.js'

// This is a randomly generated key, only used for these tests
const privateKey = '-----BEGIN RSA PRIVATE KEY-----\n'
  + 'MIIEogIBAAKCAQEAsjp00y9FwhJ2mjV3kcOp8P0azniNNnP02ejkfB69DUmYom7M\n'
  + '9NcpfQCjHxhYf62S41lFtN00s26ETROhIHHnRX84RQZB4N4Q1gSQl6z1ik4MbgIW\n'
  + 'lfNThUiAxIDmI+M2cCG2Gplg2cQ2chpoJ9h7y8WmR2lO3NPbJXgltMsxGitJ2Vp/\n'
  + 'FEtJbP6KmqLJpb7p10gxOZclNAydkCoq9JBHHvF3WPmTB2uhPqhGwRS4xy7MrFLE\n'
  + 'lyPFxvHOZ7SgNPiw2gvywwrqC7Y9K0frJ/2mZj+3cC4tM9jFL/ul8eWQoAZS3u+s\n'
  + 'z2oAzTxzgn0EKGDaEK5h+KR1LIYQIKrLSonpcQIDAQABAoIBAFUonT1y7u/mBol0\n'
  + 'VqdtSDv/k9lnvIFyMmIUZ2fvAAHjUmz6aC/sxsQVk9t9tHt9IhxDQY1DzLSXb9us\n'
  + 'L2bjRc/tE6PXc47QTFcWY0g1ujTVShceJFCNrTCYDf7WYCBxpkc5tFtNQfuLR0CJ\n'
  + '4Y54X95jmCmy5Z2aFLH4kHusQs/vZKIving4qJXfvof0AV80M6fiyonXO4Wkq9Z/\n'
  + 'mHrWFYoWj66HSCnL3j2k6fYYep3qNm8XLBkTS2LGxxzESUsH6Sk8NfQ+BpzAJTsx\n'
  + 'BLe+xoitOkB/ji3AjoJkjrppwMfvtlTF4Lfi5JuOOXx2vPUW1ckvirz1+3LMnuTV\n'
  + 'wh9X6OECgYEA+LEVSgjnOpuj/pnAGyD0RYuTfvMM72+WHIumhKVdd62Ie8WHkVqI\n'
  + 'VYRNQuPl5qi32wPh9LI6prRamnAYYXrhOnwSuxqzTDKKybSjDlhwmWMc1A0ywgDV\n'
  + 'e7d+hsqM7sOvTRHoqtoQS+oRECInLx+Z/8dgeJWZ9dHvLOb8kyzPjZ0CgYEAt3dG\n'
  + 'TB30sBx7Sy0XxwB8l//aJuYKgFnwDtUaNqoee8rYuVjzoLU+I5M4JIYpb4Wtu1CG\n'
  + '9RK+/6mm1cJgwuj5nwFNziTeMNEWHR8u3JNaP1wmgqz0EmORXu5eA4vMwp0Cpt2n\n'
  + 'dZuGHEz7s5pHmHkwMR+uchsTlcOXguzcSYEKbOUCgYADJkr8uwwio+H50XyrW0l8\n'
  + 'r/3YN7/MMH+YMPSU7Xs3js0RtDi5UIo1ew13cWdx+mUJswzjinZPsi0Lk6vbYDEG\n'
  + 'Cpg6ImZu6pzzXQRLpDcY2jZ9QQWJi3UosfQ6RMpwI65OrZFiyIw4SeiZabVRVXcf\n'
  + '1CiWnl5qzJPY37wHKSQfyQKBgAb3v7K6XIWnv0L+pm2HZjP7opRhnjp7r/NQQpua\n'
  + '4GeBL7PyXeZXm9GMENDKS56RrCR2DXoXSSu6jLyHklc0s+5HBWZz3gBqoHVgrs3v\n'
  + 'xrirTkcePHLKV0YMtYNa9t7ZSbV+q5J64qAGiHSswlVXHO5wrpZk0tyYPhPZ3Q/p\n'
  + 'l7TFAoGAN/cUNznxsvvm8Dca7T6qpe33/HqJUfFkW8Nq+qo3YOF5z2H7Sv3ZesMq\n'
  + '7RYSnppRFIqscfughegMUSy129240ip5Dj+VzYqVqyvdzHR/fuW1dG6DjqsbudBP\n'
  + '1PcczBnvV/kBUAABKlFekWWE27SMq9eoQHwofRspRgDxiQ0bdV4=\n'
  + '-----END RSA PRIVATE KEY-----'
const publicKeyModulus = 'sjp00y9FwhJ2mjV3kcOp8P0azniNNnP02ejkfB69DUmYom7M9NcpfQCjHxhYf62S41lFtN00s26ETROhIHHnRX84RQZB4N4Q1gSQl6z1ik4MbgIWlfNThUiAxIDmI-M2cCG2Gplg2cQ2chpoJ9h7y8WmR2lO3NPbJXgltMsxGitJ2Vp_FEtJbP6KmqLJpb7p10gxOZclNAydkCoq9JBHHvF3WPmTB2uhPqhGwRS4xy7MrFLElyPFxvHOZ7SgNPiw2gvywwrqC7Y9K0frJ_2mZj-3cC4tM9jFL_ul8eWQoAZS3u-sz2oAzTxzgn0EKGDaEK5h-KR1LIYQIKrLSonpcQ'
const publicKeyExponent = 'AQAB'
const keyIdentifier = 'key_identifier'

jest.mock('../../../src/auth/open-id-client.js', () => ({
  getOpenIdConfig: jest.fn().mockImplementation((getUrl) => {
    switch (getUrl) {
      case 'https://test.it/path':
        return {
          authorization_endpoint: 'http://some-auth-endpoint/path',
          token_endpoint: 'http://some-token-endpoint/path',
          end_session_endpoint: 'http://some-end-session-endpoint/path',
          jwks_uri: 'https://jwks.endpoint',
          issuer: 'https://login.microsoftonline.com/test/v2.0'
        }
      case 'https://invalid.algorithm/path':
        return {
          authorization_endpoint: 'http://some-auth-endpoint/path',
          token_endpoint: 'http://some-token-endpoint/path',
          end_session_endpoint: 'http://some-end-session-endpoint/path',
          jwks_uri: 'https://jwks.invalid.algorithm.endpoint',
          issuer: 'https://login.microsoftonline.com/test/v2.0'
        }
      case 'https://jwks.invalid.algorithm.endpoint':
        return {
          keys: [
            {
              kty: "SHA",
              n: publicKeyModulus,
              e: publicKeyExponent,
              alg: "SHA256",
              use: "sig",
              kid: keyIdentifier
            }
          ]
        }
      case 'https://timeout/path':
        return {
          authorization_endpoint: 'http://some-auth-endpoint/path',
          token_endpoint: 'http://some-token-endpoint/path',
          end_session_endpoint: 'http://some-end-session-endpoint/path',
          jwks_uri: 'https://jwks.timeout.endpoint',
          issuer: 'https://login.microsoftonline.com/test/v2.0'
        }
      case 'https://jwks.timeout.endpoint':
        throw new Error('Client request timeout')
      default:
        return {
          keys: [
            {
              kty: "RSA",
              n: publicKeyModulus,
              e: publicKeyExponent,
              alg: "RS256",
              use: "sig",
              kid: keyIdentifier
            }
          ]
        }
    }
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
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
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
      iss: 'https://login.microsoftonline.com/test/v2.0',
      user: 'Test User'
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const credentials = { provider: 'defraId', token }

  await provider.profile(credentials, { id_token: token }, {})

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
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
  })

  config.set('auth.defraId.organisations', ['allowed-org'])

  const token = jwt.token.generate(
    {
      currentRelationshipId: 'rel-1',
      relationships: ['rel1:forbidden-org'],
      iss: 'https://login.microsoftonline.com/test/v2.0',
      aud: 'test'
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      header: {
        kid: keyIdentifier
      }
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
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
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
      iss: 'https://login.microsoftonline.com/test/v2.0',
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const idToken = jwt.token.generate(
    {
      aud: 'test',
      iss: 'https://login.microsoftonline.com/test/v2.0',
      iat: 1765543445,
      nbf: 1765543445,
      exp: 4937356800,
      groups: [
        adminGroupId,
        anotherGroupId
      ],
      sub: 'testSub',
      ver: '2.0',
      sid: 'testSessionId',
      name: 'Entra Test User',
      email: 'testEmail'
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
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
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
  })

  const token = jwt.token.generate(
    {},
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      header: {
        kid: keyIdentifier
      }
    }
  )
  const idToken = jwt.token.generate(
    {
      groups: ['disallowed-group'],
      iss: 'https://login.microsoftonline.com/test/v2.0',
      aud: 'test'
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      header: {
        kid: keyIdentifier
      }
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

test.each(
  [{
    aud: 'FOO',
    error: 'Token audience is not allowed'
  },
  {
    iss: 'FOO',
    error: 'Token payload iss value not allowed'
  },
  {
    expiry: 1765543445,
    error: 'Token expired'
  }]
)('credentials token verification fails when claim invalid', async (options) => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
  })

  const currentRelationshipId = 'rel-id-909'
  const organisationId = 'org-id-123'

  config.set('auth.defraId.organisations', [organisationId])

  const credentialsToken = jwt.token.generate(
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
      aud: options.aud || 'test',
      iss: options.iss || 'https://login.microsoftonline.com/test/v2.0',
      user: 'Test User',
      exp: options.expiry || 4937356800
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const credentials = { provider: 'defraId', token: credentialsToken }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    `defraId Token failed verification: ${options.error}`
  )
})

test.each(
  [{
    aud: 'FOO',
    error: 'Token audience is not allowed'
  },
    {
      iss: 'FOO',
      error: 'Token payload iss value not allowed'
    },
    {
      expiry: 1765543445,
      error: 'Token expired'
    }]
)('entra id token verification fails when claim invalid', async (options) => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
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
      aud: options.aud || 'test',
      iss: options.iss || 'https://login.microsoftonline.com/test/v2.0',
      exp: options.expiry || 4937356800
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const idToken = jwt.token.generate(
    {
      aud: options.aud || 'test',
      iss: options.iss || 'https://login.microsoftonline.com/test/v2.0',
      iat: 1765543445,
      nbf: 1765543445,
      exp: options.expiry || 4937356800,
      groups: [
        adminGroupId,
        anotherGroupId
      ],
      sub: 'testSub',
      ver: "2.0"
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const credentials = { provider: AUTH_PROVIDERS.ENTRA_ID, token }

  const params = { id_token: idToken }

  expect(async () => provider.profile(credentials, params, {})).rejects.toThrow(
    `entraId Token failed verification: ${options.error}`
  )
})

test('token verification fails when token signature invalid', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test'
  })

  // A token created and signed using an unknown private key pair
  const tamperedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleV9pZGVudGlmaWVyIn0.eyJzdWIiOiJ0ZXN0U3ViIiwiY29ycmVsYXRpb25JZCI6InRlc3RDb3JyZWxhdGlvbklkIiwic2Vzc2lvbklkIjoidGVzdFNlc3Npb25JZCIsImZpcnN0TmFtZSI6IlRlc3QiLCJsYXN0TmFtZSI6IlVzZXIiLCJlbWFpbCI6InRlc3RFbWFpbCIsInVuaXF1ZVJlZmVyZW5jZSI6InRlc3RVbmlxdWVSZWYiLCJjdXJyZW50UmVsYXRpb25zaGlwSWQiOiJyZWwtaWQtMDAwIiwicmVsYXRpb25zaGlwcyI6WyJyZWwtaWQtMDAwOm9yZy1pZC00NTYiXSwicm9sZXMiOiJ0ZXN0Um9sZXMiLCJhdWQiOiJ0ZXN0IiwiaXNzIjoidGVzdCIsInVzZXIiOiJUZXN0IFVzZXIiLCJleHAiOjQ5MzczNTY4MDAsImlhdCI6MTc4MTY5NzQyOH0.h4TFNCDwBjs_WZB1nzKzIJ38b162MfYZlxs6WGzeKWkZnSG_ebMtxkX4u00T5fF0-5iW2X2mtrvLc3-DRciFMDN2ayw70pTP0Dh3XsAfC7NuK3hRHzkpHCaQtSoHyJ2nN5XGh_NM7hifDBCkiz73BUE9ebhuKzYc9cPbLjBg4LC5M4ie8EYdeCJcQhNVX5KZ9SliMFk_gS5TLOq7jwm-5vGOW4KKqTpHLTn59RsAfAjxmVL2_TDLCUNgQ08cKZKuZf0DjkfTGR9URBlLC31dXbnXzhuR0r5NE92s-JB7axwCYnPVTq0ZpXapiTlGicYynD9yCZ3t_tolDMKlJYoGCw"

  const credentials = { provider: 'defraId', token: tamperedToken }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    'defraId Token failed verification: Invalid token signature'
  )
})

test('jwks uri return an unexpected signing algorithm', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://invalid.algorithm/path',
    clientId: 'test'
  })

  const currentRelationshipId = 'rel-id-909'
  const organisationId = 'org-id-123'

  config.set('auth.defraId.organisations', [organisationId])

  const credentialsToken = jwt.token.generate(
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
      iss: 'https://login.microsoftonline.com/test/v2.0',
      user: 'Test User',
      exp: 1765543445,
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: keyIdentifier
      }
    }
  )

  const credentials = { provider: 'defraId', token: credentialsToken }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    'Unexpected algorithm used for token signing: SHA'
  )
})

test('no matching jwks key found', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://test.it/path',
    clientId: 'test',
    jwksClientTimeout: 1000
  })

  const currentRelationshipId = 'rel-id-909'
  const organisationId = 'org-id-123'

  config.set('auth.defraId.organisations', [organisationId])

  const credentialsToken = jwt.token.generate(
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
      iss: 'https://login.microsoftonline.com/test/v2.0',
      user: 'Test User',
      exp: 1765543445,
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: 'unknown_key_id'
      }
    }
  )

  const credentials = { provider: 'defraId', token: credentialsToken }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    'Unable to find defraId JWKS key matching kid: unknown_key_id'
  )
})

test('jwks key retrieval timeout exception', async () => {
  const provider = await openIdProvider(AUTH_PROVIDERS.DEFRA_ID, {
    oidcConfigurationUrl: 'https://timeout/path',
    clientId: 'test',
    jwksClientTimeout: 100
  })

  config.set('auth.defraId.organisations', ['org-id-123'])

  const credentialsToken = jwt.token.generate(
    {
      sub: 'testSub',
      correlationId: 'testCorrelationId',
      sessionId: 'testSessionId',
      firstName: 'Test',
      lastName: 'User',
      email: 'testEmail',
      uniqueReference: 'testUniqueRef',
      currentRelationshipId: 'rel-id-909',
      relationships: ['rel-id-909:org-id-123'],
      roles: 'testRoles',
      aud: 'test',
      iss: 'https://login.microsoftonline.com/test/v2.0',
      user: 'Test User',
      exp: 4937356800,
    },
    {
      key: privateKey,
      algorithm: 'RS256'
    },
    {
      ttlSec: 1,
      header: {
        kid: 'key_identifier'
      }
    }
  )

  const credentials = { provider: 'defraId', token: credentialsToken }

  expect(async () => provider.profile(credentials, {}, {})).rejects.toThrow(
    'Client request timeout'
  )
})
