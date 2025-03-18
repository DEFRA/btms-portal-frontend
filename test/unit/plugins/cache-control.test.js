import { startServer } from '../../../src/utils/start-server.js'
import { paths } from '../../../src/routes/route-constants.js'

describe('#cacheControl', () => {
  let server

  beforeAll(async () => {
    server = await startServer()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#When request for non public route', () => {
    test('Should use non caching headers', async () => {
      const { headers } = await server.inject({
        method: 'GET',
        url: paths.LANDING
      })

      expect(headers['cache-control']).toEqual('no-store, no-cache, must-revalidate, max-age=0')
    })
  })

  describe('#When request for public static asset', () => {
    test('Should use caching headers', async () => {
      const { headers } = await server.inject({
        method: 'GET',
        url: '/public/stylesheets/application.css'
      })

      expect(headers['cache-control']).toEqual('max-age=31536000')
    })
  })
})
