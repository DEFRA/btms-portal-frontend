import { startServer } from '../../../src/utils/start-server.js'
import { constants as httpConstants } from 'http2'

describe('#serveHealthEndpoint', () => {
  let server

  beforeEach(async () => {
    server = await startServer()
  })

  afterEach(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('When secure context is disabled', () => {
    test('Should respond as healthy', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toBe('{"message":"success"}')
    })
  })
})
