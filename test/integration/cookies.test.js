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
    payload: {
      analytics: 'yes',
      previousUrl: '/somewhere'
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
    payload: { previousUrl: '/cookies' }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/cookies')

  expect(request.yar.flash('cookiesError')).toEqual([true])
})
