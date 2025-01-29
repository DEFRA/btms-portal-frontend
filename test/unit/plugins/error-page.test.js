import Boom from '@hapi/boom'
import { createServer } from '../../../src/server.js'
import { constants as httpConstants } from 'http2'
import expect from 'expect'

describe('#errors', () => {
  /** @type {Server} */
  let server

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
      expect.stringContaining('Page not found | btms-portal-frontend')
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
      expect.stringContaining('Something went wrong | btms-portal-frontend')
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
      expect.stringContaining('Bad Request | btms-portal-frontend')
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
      expect.stringContaining('Forbidden | btms-portal-frontend')
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
      expect.stringContaining('Unauthorized | btms-portal-frontend')
    )
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_UNAUTHORIZED)
  })
})

//
// describe('#serveFriendlyErrorPage', () => {
//   const mockErrorLogger = jest.fn()
//   const mockStack = 'Mock error stack'
//   const errorPage = 'error'
//   const mockRequest = (/** @type {number} */ statusCode) => ({
//     response: {
//       isBoom: true,
//       stack: mockStack,
//       output: {
//         statusCode
//       }
//     },
//     logger: { error: mockErrorLogger }
//   })
//   const mockToolkitView = jest.fn()
//   const mockToolkitCode = jest.fn()
//   const mockToolkit = {
//     view: mockToolkitView.mockReturnThis(),
//     code: mockToolkitCode.mockReturnThis()
//   }
//
//   test('Should provide expected "Not Found" page', () => {
//     serveFriendlyErrorPage(mockRequest(httpConstants.HTTP_STATUS_NOT_FOUND), mockToolkit)
//
//     expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Page not found',
//       heading: httpConstants.HTTP_STATUS_NOT_FOUND,
//       message: 'Page not found'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_NOT_FOUND
//     )
//   })
//
//   test('Should provide expected "Forbidden" page', () => {
//     serveFriendlyErrorPage(mockRequest(httpConstants.HTTP_STATUS_FORBIDDEN), mockToolkit)
//
//     expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Forbidden',
//       heading: httpConstants.HTTP_STATUS_FORBIDDEN,
//       message: 'Forbidden'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_FORBIDDEN
//     )
//   })
//
//   test('Should provide expected "Unauthorized" page', () => {
//     serveFriendlyErrorPage(mockRequest(httpConstants.HTTP_STATUS_UNAUTHORIZED), mockToolkit)
//
//     expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Unauthorized',
//       heading: httpConstants.HTTP_STATUS_UNAUTHORIZED,
//       message: 'Unauthorized'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_UNAUTHORIZED
//     )
//   })
//
//   test('Should provide expected "Bad Request" page', () => {
//     serveFriendlyErrorPage(mockRequest(httpConstants.HTTP_STATUS_BAD_REQUEST), mockToolkit)
//
//     expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Bad Request',
//       heading: httpConstants.HTTP_STATUS_BAD_REQUEST,
//       message: 'Bad Request'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_BAD_REQUEST
//     )
//   })
//
//   test('Should provide expected default page', () => {
//     serveFriendlyErrorPage(mockRequest(httpConstants.HTTP_STATUS_TEAPOT), mockToolkit)
//
//     expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Something went wrong',
//       heading: httpConstants.HTTP_STATUS_TEAPOT,
//       message: 'Something went wrong'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_TEAPOT
//     )
//   })
//
//   test('Should provide expected "Something went wrong" page and log error for internalServerError', () => {
//     serveFriendlyErrorPage(
//       mockRequest(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR),
//       mockToolkit
//     )
//
//     expect(mockErrorLogger).toHaveBeenCalledWith(mockStack)
//     expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
//       pageTitle: 'Something went wrong',
//       heading: httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
//       message: 'Something went wrong'
//     })
//     expect(mockToolkitCode).toHaveBeenCalledWith(
//       httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR
//     )
//   })
// })
//
// /**
//  * @import { Server } from '@hapi/hapi'
//  */
