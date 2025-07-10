import { paths } from '../../src/routes/route-constants.js'
import { getByRole, queryByRole } from '@testing-library/dom'
import globalJsdom from 'global-jsdom'
import { constants as httpConstants } from 'http2'
import { initialiseServer } from '../utils/initialise-server.js'

test('cookies page renders', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  globalJsdom(payload)

  getByRole(document.body, 'heading', {
    name: 'Cookies',
    level: 1
  })
  expect(document.title).toBe('Cookies - Border Trade Matching Service')
})

test('the cookie banner does not display on the cookies page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.COOKIES
  })

  globalJsdom(payload)

  const cookieBanner = queryByRole(document.body, 'region', {
    name: 'Cookies on Border Trade Matching Service'
  })
  expect(cookieBanner).not.toBeInTheDocument()
})

test('agreeing to accept analytics cookies sets the cookie_policy cookie correctly', async () => {
  const server = await initialiseServer()

  const { payload, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[analytics]': 'yes',
      previousUrl: '/cookies'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('You’ve set your cookie preferences.')
  expect(request._states.cookie_policy.value).toEqual({ analytics: true })
})

test('rejecting analytics cookies sets the cookie_policy cookie correctly', async () => {
  const server = await initialiseServer()

  const { payload, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[analytics]': 'no',
      previousUrl: '/cookies'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('You’ve set your cookie preferences.')
  expect(request._states.cookie_policy.value).toEqual({ analytics: false })
})

test('POSTing to the /cookies endpoint with an invalid payload returns a 404', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    payload: {
      'cookies[analytics]': 'abcd'
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
      'cookies[analytics]': 'yes'
    }
  })

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
})
