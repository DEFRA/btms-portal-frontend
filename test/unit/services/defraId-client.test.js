import Wreck from '@hapi/wreck'
import { getDefraIdAuthConfig, getDefraIdRefreshToken } from '../../../src/services/defraId-client.js'
import { config } from '../../../src/config/config.js'
import Querystring from 'querystring'

jest.mock('@hapi/wreck', () => ({
  ...jest.requireActual('@hapi/wreck'),
  get: jest.fn().mockReturnValue({}),
  post: jest.fn(),
  defaults: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({}),
    post: jest.fn()
  })
}))

jest.mock('../../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn()
  })
}))

const oidcConfigUrl = 'https://some-oidc-configuration-endpoint'
const oidcRefreshUrl = 'https://some-token-refresh-endpoint'

describe('#defraIdClient', () => {
  describe('#getDefraIdAuthConfig', () => {
    test('Should call wreck get', async () => {
      await getDefraIdAuthConfig(oidcConfigUrl)

      expect(Wreck.get).toHaveBeenCalledWith(
        oidcConfigUrl,
        expect.objectContaining({
          json: 'strict'
        })
      )
    })

    describe('#When HTTP Proxy URL is defined', () => {
      afterAll(() => {
        config.set('httpProxy', null)
        config.set('httpsProxy', null)
      })

      test.each([
        { httpProxyUrl: 'http://some-proxy', httpsProxyUrl: null },
        { httpProxyUrl: null, httpsProxyUrl: 'http://some-proxy' }
      ])('Should use proxied agents', async ({ httpProxyUrl, httpsProxyUrl }) => {
        config.set('httpProxy', httpProxyUrl)
        config.set('httpsProxy', httpsProxyUrl)

        await getDefraIdAuthConfig(oidcConfigUrl)

        expect(Wreck.defaults).toHaveBeenCalledWith({
          agents: {
            https: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
            http: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
            httpsAllowUnauthorized: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) })
          }
        })
      })
    })
  })

  describe('#getDefraIdRefreshToken', () => {
    test('Should call wreck post', async () => {
      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid'
      }

      await getDefraIdRefreshToken(oidcRefreshUrl, params)

      const expectedPayload = Querystring.stringify(params)

      expect(Wreck.post).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload: expectedPayload
        })
      )
    })

    describe('#When HTTP Proxy URL is defined', () => {
      afterAll(() => {
        config.set('httpProxy', null)
        config.set('httpsProxy', null)
      })

      test.each([
        { httpProxyUrl: 'http://some-proxy', httpsProxyUrl: null },
        { httpProxyUrl: null, httpsProxyUrl: 'http://some-proxy' }
      ])('Should use proxied agents', async ({ httpProxyUrl, httpsProxyUrl }) => {
        config.set('httpProxy', httpProxyUrl)
        config.set('httpsProxy', httpsProxyUrl)

        await getDefraIdRefreshToken(oidcConfigUrl)

        expect(Wreck.defaults).toHaveBeenCalledWith({
          agents: {
            https: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
            http: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
            httpsAllowUnauthorized: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) })
          }
        })
      })
    })
  })
})
