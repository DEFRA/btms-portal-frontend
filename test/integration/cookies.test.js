import { paths } from '../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'

test('cookies page renders', async () => {
  const server = await initialiseServer()

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  globalJsdom(payload)

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('Essential cookies')
})

test('the cookie banner does not display on the cookies page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  globalJsdom(payload)

  expect(payload).not.toContain('Cookies on Border Trade Matching Service')
})

test('agreeing to accept additional cookies sets the cookie_policy cookie correctly', async () => {
  const server = await initialiseServer()

  const { payload, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[additional]': 'yes'
    }
  })

  globalJsdom(payload)

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
      'cookies[additional]': 'no'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('You’ve set your cookie preferences.')
  expect(JSON.parse(request._states.cookie_policy.value)).toEqual({ analytics: false })
})
