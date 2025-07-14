export const securityHeaders = {
  name: 'security-headers',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      const headersToAdd = {
        'content-security-policy':
          "default-src 'self'; " +
          `script-src 'self' 'nonce-${request.app.cspNonce}'; ` +
          "style-src 'self'; " +
          "img-src 'self' data: www.googletagmanager.com; " +
          "connect-src 'self' www.googletagmanager.com www.google.com; " +
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

      Object.entries(headersToAdd)
        .forEach(([key, value]) => {
          request.response.headers[key] = value
        })

      return h.continue
    })
  }
}
