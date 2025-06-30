import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'
import globalJsdom from 'global-jsdom'

test('when cookie policy has not been accepted, the cookie banner is visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(payload).toContain('Cookies on Border Trade Matching Service')
})

test('when cookie_policy cookie is garbled, the cookie banner is visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=anfojaenojas'
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(payload).toContain('Cookies on Border Trade Matching Service')
})

test('when cookie policy has been accepted, the cookie banner is not visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy={"analytics":true}'
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(payload).not.toContain('Cookies on Border Trade Matching Service')
})

test('when user accepts additional cookies, the cookie is set with analytics as true', async () => {
  const server = await initialiseServer()

  const { request, payload } = await server.inject({
    method: 'get',
    url: `${paths.LANDING}?cookies[additional]=yes`
  })

  globalJsdom(payload)

  expect(JSON.parse(request._states.cookie_policy.value)).toEqual({ analytics: true })
})

test('when user rejects additional cookies, the cookie is set with analytics as false', async () => {
  const server = await initialiseServer()

  const { request, payload } = await server.inject({
    method: 'get',
    url: `${paths.LANDING}?cookies[additional]=no`
  })

  globalJsdom(payload)

  expect(JSON.parse(request._states.cookie_policy.value)).toEqual({ analytics: false })
})
