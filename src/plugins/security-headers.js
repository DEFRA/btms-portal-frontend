import { config } from '../config/config.js'

export const securityHeaders = {
  name: 'security-headers',
  async register (server) {
    server.ext('onPreResponse', (request, h) => {
      const { defraId, entraId } = config.get('auth')

      const formActions = [defraId, entraId]
        .map(({ oidcConfigurationUrl }) => {
          const { origin } = new URL(oidcConfigurationUrl)
          return origin
        })
        .join(' ')

      const headersToAdd = {
        'content-security-policy':
          "default-src 'self'; " +
          `script-src 'self' 'nonce-${request.app.cspNonce}'; ` +
          "style-src 'self'; " +
          "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; " +
          "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          `form-action 'self' ${formActions};`,
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-resource-policy': 'same-origin',
        'origin-agent-cluster': '?1',
        'permissions-policy': 'geolocation=(), camera=(), microphone=()',
        'referrer-policy': 'no-referrer',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'x-download-options': 'noopen'
      }

      Object.entries(headersToAdd).forEach(([key, value]) => {
        request.response.headers[key] = value
      })

      return h.continue
    })
  }
}
