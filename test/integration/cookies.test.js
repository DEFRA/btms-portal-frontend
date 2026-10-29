import { paths } from '../../src/routes/route-constants.js'
import { getByRole, queryByRole } from '@testing-library/dom'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'

test('get: cookies page renders', async () => {
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

test('get: the cookie banner is not rendered', async () => {
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

test('post: analytics sets the cookiePolicy & triggers confirmation', async () => {
  const server = await initialiseServer()

  const { statusCode, request, headers } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      analytics: 'yes',
      previousUrl: '/somewhere',
      crumb: 'test-crumb'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/somewhere')

  const [cookieString] = headers['set-cookie']
  const { states } = await server.states.parse(cookieString)

  expect(states.cookiePolicy).toEqual({ analytics: 'yes' })
  expect(request.yar.flash('showCookieConfirmationBanner')).toEqual([true])
})

test('post: no cookie option chosen', async () => {
  const server = await initialiseServer()
  const { headers, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      previousUrl: '/cookies',
      crumb: 'test-crumb'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/cookies')

  expect(request.yar.flash('cookiesError')).toEqual([true])
})

test('post: previous URL not starting with relative path, fails validation and redirected to cookies page', async () => {
  const server = await initialiseServer()
  const { headers, request, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      previousUrl: 'http://www.phishing.com',
      crumb: 'test-crumb'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/cookies')

  expect(request.yar.flash('cookiesError')).toEqual([true])
})

test.each([
  '//',
  '/\\',
  '/\t/'
])('post: previous URL starting with %s is redirected to cookies page', async (invalidPathPrefix) => {
  const server = await initialiseServer()
  const { headers, statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      analytics: 'yes',
      previousUrl: `${invalidPathPrefix}phishing`,
      crumb: 'test-crumb'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/cookies')
})

test('post: with invalid crumb is forbidden', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'post',
    url: paths.COOKIES,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      analytics: 'yes',
      previousUrl: '/somewhere',
      crumb: 'invalid-crumb'
    }
  })

  expect(statusCode).toBe(403)
})
