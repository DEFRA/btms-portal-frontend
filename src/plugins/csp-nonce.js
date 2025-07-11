import crypto from 'node:crypto'

export const cspNonce = {
  name: 'csp-nonce',
  async register(server) {
    server.ext('onRequest', (request, h) => {
      request.app.cspNonce = crypto.randomBytes(16).toString('base64')
      return h.continue
    })
  }
}
