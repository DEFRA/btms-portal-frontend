import { wreckProxyConfiguration } from '../../../src/plugins/wreck-proxy-configuration.js'
import { config } from '../../../src/config/config.js'
import Wreck from '@hapi/wreck'

describe('#wreckProxyConfiguration', () => {
  beforeEach(() => {
    jest.resetModules()
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

      wreckProxyConfiguration.plugin.register()

      expect(Wreck.agents).toEqual(
        expect.objectContaining({
          https: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
          http: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) }),
          httpsAllowUnauthorized: expect.objectContaining({ connectOpts: expect.objectContaining({ host: 'some-proxy' }) })
        }))
    })
  })

  describe('#When HTTP Proxy URL is not defined', () => {
    test('Should use default agents', async () => {
      const Wreck = await import('@hapi/wreck')

      wreckProxyConfiguration.plugin.register()

      expect(Wreck.agents).toEqual(
        expect.objectContaining({
          https: expect.not.objectContaining({ connectOpts: expect.anything() }),
          http: expect.not.objectContaining({ connectOpts: expect.anything() }),
          httpsAllowUnauthorized: expect.not.objectContaining({ connectOpts: expect.anything() })
        }))
    })
  })
})
