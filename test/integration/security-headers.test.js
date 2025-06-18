import { initialiseServer } from '../utils/initialise-server.js'

test('common responses', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'get',
    url: '/'
  })

  expect(headers)
    .toEqual({
      'accept-ranges': 'bytes',
      'content-security-policy': "default-src 'self'; script-src 'self' 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' 'sha256-uHGkJwHxU+M7xHQgrwOcFeeWse8WK+FzkrkQQF5rk5Y=' 'sha256-fwdedhdbz9FmWG14XxCNLJTnz76qk8IWqi1Q2jNSuxc='; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
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
