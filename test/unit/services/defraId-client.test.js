import Wreck from '@hapi/wreck'
import { getDefraIdAuthConfig, getDefraIdRefreshToken } from '../../../src/services/defraId-client.js'

const mockPost = jest.fn()

jest.mock('@hapi/wreck', () => ({
  get: jest.fn().mockReturnValue({}),
  post: (...args) => mockPost(...args)
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
  })

  describe('#getDefraIdRefreshToken', () => {
    test('Should return ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 200
        },
        payload: '{ "access_token": "FOO" }'
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getDefraIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload: 'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeTruthy()
      expect(result.json).toEqual(expect.objectContaining({
        access_token: 'FOO'
      }))
    })

    test('Should return not ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 500
        }
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getDefraIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload: 'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeFalsy()
      expect(result).toEqual(expect.not.objectContaining({
        json: expect.anything()
      }))
    })
  })
})
