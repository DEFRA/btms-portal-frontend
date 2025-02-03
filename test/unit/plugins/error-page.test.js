import Boom from '@hapi/boom'
import { createServer } from '../../../src/server.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'

describe('#errors', () => {
  /** @type {Server} */
  let server
  const serviceName = config.get(configKeys.SERVICE_NAME)

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected Not Found error page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/non-existent-path'
    })

    expect(result).toEqual(
      expect.stringContaining(`Page not found - ${serviceName}`)
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_NOT_FOUND)
  })

  test('Should provide expected Something went wrong error page', async () => {
    server.route({
      method: 'GET',
      path: '/simulate-error',
      handler: (_request, h) => {
        throw new Error('error scenario test')
      }
    })
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/simulate-error'
    })

    expect(result).toEqual(
      expect.stringContaining(`Something went wrong - ${serviceName}`)
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
  })

  test('Should provide expected Bad request error page', async () => {
    server.route({
      method: 'GET',
      path: '/simulate-bad-request-error',
      handler: (_request, h) => {
        return Boom.badRequest()
      }
    })
    const { payload, statusCode } = await server.inject({
      method: 'GET',
      url: '/simulate-bad-request-error'
    })

    expect(payload).toEqual(
      expect.stringContaining(`Bad Request - ${serviceName}`)
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
  })

  test('Should provide expected Forbidden error page', async () => {
    server.route({
      method: 'GET',
      path: '/simulate-forbidden-error',
      handler: (_request, h) => {
        return Boom.forbidden()
      }
    })
    const { payload, statusCode } = await server.inject({
      method: 'GET',
      url: '/simulate-forbidden-error'
    })

    expect(payload).toEqual(
      expect.stringContaining(`Forbidden - ${serviceName}`)
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_FORBIDDEN)
  })

  test('Should provide expected Forbidden error page', async () => {
    server.route({
      method: 'GET',
      path: '/simulate-unauthorized-error',
      handler: (_request, h) => {
        return Boom.unauthorized()
      }
    })
    const { payload, statusCode } = await server.inject({
      method: 'GET',
      url: '/simulate-unauthorized-error'
    })

    expect(payload).toEqual(
      expect.stringContaining(`Unauthorized - ${serviceName}`)
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_UNAUTHORIZED)
  })
})
