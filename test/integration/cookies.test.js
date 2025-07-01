import { paths } from '../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'
import { initialiseServer } from '../utils/initialise-server.js'

test('cookies page renders', async () => {
  const server = await initialiseServer()

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('Essential cookies')
})

test('the cookie banner does not display on the cookies page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  expect(payload).not.toContain('Cookies on Border Trade Matching Service')
})

test('agreeing to accept additional cookies sets the cookie_policy cookie correctly', async () => {
  const server = await initialiseServer()

  const { payload, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[additional]': 'yes',
      previousUrl: '/cookies'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('You’ve set your cookie preferences.')
  expect(JSON.parse(request._states.cookie_policy.value)).toEqual({ analytics: true })
})

test('rejecting additional cookies sets the cookie_policy cookie correctly', async () => {
  const server = await initialiseServer()

  const { payload, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[additional]': 'no',
      previousUrl: '/cookies'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('You’ve set your cookie preferences.')
  expect(JSON.parse(request._states.cookie_policy.value)).toEqual({ analytics: false })
})

test('POSTing to the /cookies endpoint with an invalid payload returns a 404', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[additional]': 'abcd'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
})

test('POSTing to the /cookies endpoint without a previousUrl returns a 404', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[additional]': 'yes'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
})
