const govScriptTag = 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='
const searchScriptTag = 'sha256-uHGkJwHxU+M7xHQgrwOcFeeWse8WK+FzkrkQQF5rk5Y='
const searchResultsScriptTag = 'sha256-fwdedhdbz9FmWG14XxCNLJTnz76qk8IWqi1Q2jNSuxc='

const headersToAdd = {
  'content-security-policy':
    "default-src 'self'; " +
    `script-src 'self' '${govScriptTag}' '${searchScriptTag}' '${searchResultsScriptTag}'; ` +
    "style-src 'self'; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'origin-agent-cluster': '?1',
  'permissions-policy': 'geolocation=(), camera=(), microphone=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-download-options': 'noopen'
}

export const securityHeaders = {
  name: 'security-headers',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      Object.entries(headersToAdd)
        .forEach(([key, value]) => {
          request.response.headers[key] = value
        })

      return h.continue
    })
  }
}
