import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('get: renders page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SIGN_IN_CHOOSE
  })

  globalJsdom(payload)

  const fieldSet = getByRole(document.body, 'group', {
    name: 'How do you want to sign in?'
  })

  expect(fieldSet).not.toHaveAttribute('aria-describedby', 'authProvider-error')
})

test('get: renders page with error', async () => {
  const state = {
    type: 'signInError',
    message: true
  }
  const server = await initialiseServer(state)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SIGN_IN_CHOOSE
  })

  globalJsdom(payload)

  const fieldSet = getByRole(document.body, 'group', {
    name: 'How do you want to sign in?'
  })

  expect(fieldSet).toHaveAttribute('aria-describedby', 'authProvider-error')
})

test('post: redirects to EntraId sign in', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE,
    payload: {
      authProvider: 'entraId'
    }
  })

  expect(headers.location).toBe('/sign-in-entra')
})

test('post: redirects to DefraId sign in', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE,
    payload: {
      authProvider: 'defraId'
    }
  })

  expect(headers.location).toBe('/sign-in')
})

test('post: redirects back for invalid payload', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE
  })

  expect(headers.location).toBe('/sign-in-choose')
})
