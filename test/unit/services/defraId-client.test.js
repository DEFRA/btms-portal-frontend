import Wreck from '@hapi/wreck'
import { getAgents, getDefraIdAuthConfig } from '../../../src/services/defraId-client.js'
import { config } from '../../../src/config/config.js'
import { HttpsProxyAgent } from 'https-proxy-agent'

jest.mock('@hapi/wreck', () => {
  const originalWreck = jest.requireActual('@hapi/wreck')

  return {
    defaults: jest.fn(),
    get: jest.fn(),
    agents: originalWreck.agents
  }
})

jest.mock('../../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn()
  })
}))

const oidcConfigUrl = 'https://some-oidc-configuration-endpoint'

describe('#defraIdClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    Wreck.get.mockReturnValue({})
  })

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
  })

  describe('#getAgents', () => {
    afterEach(() => {
      config.set('httpProxy', null)
      config.set('httpsProxy', null)
    })

    describe('#When Proxy URL is not defined', () => {
      test('Should use Wreck default agents', async () => {
        const result = getAgents()

        expect(result.http).not.toBeInstanceOf(HttpsProxyAgent)
        expect(result.http.proxy).toBeUndefined()
        expect(result.https).not.toBeInstanceOf(HttpsProxyAgent)
        expect(result.https.proxy).toBeUndefined()
        expect(result.httpsAllowUnauthorized).not.toBeInstanceOf(HttpsProxyAgent)
        expect(result.httpsAllowUnauthorized.proxy).toBeUndefined()
      })
    })

    describe('#When HTTP Proxy URL is defined', () => {
      test.each([
        { httpProxyUrl: 'http://some-proxy', httpsProxyUrl: null },
        { httpProxyUrl: null, httpsProxyUrl: 'http://some-proxy' }
      ])('Should use proxied agents', async ({ httpProxyUrl, httpsProxyUrl }) => {
        config.set('httpProxy', httpProxyUrl)
        config.set('httpsProxy', httpsProxyUrl)

        const result = getAgents()

        expect(result.http).toBeInstanceOf(HttpsProxyAgent)
        expect(result.http.proxy.host).toEqual('some-proxy')
        expect(result.https).toBeInstanceOf(HttpsProxyAgent)
        expect(result.https.proxy.host).toEqual('some-proxy')
        expect(result.httpsAllowUnauthorized).toBeInstanceOf(HttpsProxyAgent)
        expect(result.httpsAllowUnauthorized.proxy.host).toEqual('some-proxy')
      })
    })
  })
})
