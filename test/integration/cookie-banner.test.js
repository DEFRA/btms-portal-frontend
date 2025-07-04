import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('when cookie policy has not been accepted, the cookie banner is visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING
  })

  expect(payload).toContain('Cookies on Border Trade Matching Service')
})

test('when cookie_policy cookie is garbled, the cookie is deleted', async () => {
  const server = await initialiseServer()

  const { request } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=anfojaenojas'
    },
    method: 'get',
    url: paths.LANDING
  })

  const cookiePolicyRemoval = request.response.headers['set-cookie'].find(c => c.startsWith('cookie_policy'))

  expect(cookiePolicyRemoval).toContain('Max-Age=0')
})

test('when cookie policy has been accepted, the cookie banner is not visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":true}').toString('base64')
    },
    method: 'get',
    url: paths.LANDING
  })

  expect(payload).not.toContain('Cookies on Border Trade Matching Service')
})

test('when user accepts analytics cookies, the cookie is set with analytics as true', async () => {
  const server = await initialiseServer()

  const { request } = await server.inject({
    method: 'post',
    payload: {
      'cookies[analytics]': 'yes',
      previousUrl: '/'
    },
    url: `${paths.COOKIES}`
  })

  expect(request._states.cookie_policy.value).toEqual({ analytics: true })
})

test('when user rejects analytics cookies, the cookie is set with analytics as false', async () => {
  const server = await initialiseServer()

  const { request } = await server.inject({
    method: 'post',
    payload: {
      'cookies[analytics]': 'no',
      previousUrl: '/'
    },
    url: `${paths.COOKIES}`
  })

  expect(request._states.cookie_policy.value).toEqual({ analytics: false })
})

test('when user clicks accept or reject in the cookie banner, they are redirected back to their original location', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    payload: {
      'cookies[analytics]': 'no',
      previousUrl: '/search'
    },
    url: `${paths.COOKIES}`
  })

  expect(headers.location).toBe('/search?cookieBannerConfirmation=true')
})

test('when the user has accepted cookies, after redirecting they are shown a confirmation notification', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":true}').toString('base64')
    },
    method: 'get',
    url: `${paths.LANDING}?cookieBannerConfirmation=true`
  })

  expect(payload).toContain('You’ve accepted additional cookies.')
})

test('when the user has rejected cookies, after redirecting they are shown a confirmation notification', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":true}').toString('base64')
    },
    method: 'get',
    url: `${paths.LANDING}?cookieBannerConfirmation=true`
  })

  expect(payload).toContain('You’ve rejected additional cookies.')
})

test('the cookie banner is not displayed on an error page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: '/404'
  })

  expect(payload).not.toContain('Cookies on Border Trade Matching Service')
})
