import { startServer } from '../../../src/utils/start-server.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths } from '../../../src/routes/route-constants.js'

describe('#serveHomePage', () => {
  let server

  beforeEach(async () => {
    server = await startServer()
  })

  afterEach(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('When secure context is disabled', () => {
    test('Should respond with home page', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.LANDING
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toEqual(expect.stringContaining(`Home - ${config.get(configKeys.SERVICE_NAME)}`))
    })
  })

  describe('#When route is requested', () => {
    test('Should return non caching headers', async () => {
      const { headers } = await server.inject({
        method: 'GET',
        url: paths.LANDING
      })

      expect(headers['cache-control']).toEqual('no-store, no-cache, must-revalidate, max-age=0')
    })
  })
})
