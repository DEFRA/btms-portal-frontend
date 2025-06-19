import { initialiseServer } from '../utils/initialise-server.js'

jest.mock('node:crypto', () => ({
  randomBytes: jest.fn()
    .mockReturnValue('random')
}))

test('common responses', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'get',
    url: '/'
  })

  expect(headers)
    .toEqual({
      'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-random'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'permissions-policy': 'geolocation=(), camera=(), microphone=()',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-download-options': 'noopen',
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
      'content-length': expect.any(Number),
      date: expect.any(String),
      connection: 'keep-alive',
      vary: 'accept-encoding'
    })
})
