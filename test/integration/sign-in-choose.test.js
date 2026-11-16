import globalJsdom from 'global-jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('get: renders page', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SIGN_IN_CHOOSE,
    headers: {
      cookie: 'crumb=test-crumb'
    }
  })

  globalJsdom(payload)

  const fieldSet = getByRole(document.body, 'group', {
    name: 'How do you want to sign in?'
  })

  expect(fieldSet).not.toHaveAttribute('aria-describedby', 'authProvider-error')

  const signInFormCrumb = document.body.querySelector('form.btms-sign-in input[name="crumb"]')
  expect(signInFormCrumb).toBeInTheDocument()
  expect(signInFormCrumb.value).toBe('test-crumb')
  expect(signInFormCrumb).toHaveAttribute('type', 'hidden')
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
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      authProvider: 'entraId',
      crumb: 'test-crumb'
    }
  })

  expect(headers.location).toBe('/sign-in-entra')
})

test('post: redirects to DefraId sign in', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      authProvider: 'defraId',
      crumb: 'test-crumb'
    }
  })

  expect(headers.location).toBe('/sign-in')
})

test('post: redirects back for invalid payload', async () => {
  const server = await initialiseServer()

  const { headers } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      crumb: 'test-crumb'
    }
  })

  expect(headers.location).toBe('/sign-in-choose')
})

test('post: with invalid crumb is forbidden', async () => {
  const server = await initialiseServer()

  const { payload, statusCode } = await server.inject({
    method: 'post',
    url: paths.SIGN_IN_CHOOSE,
    headers: {
      cookie: 'crumb=test-crumb'
    },
    payload: {
      crumb: 'invalid-crumb'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(403)
  expect(document.title).toBe('Request validation failed - Border Trade Matching Service')
  expect(
    getByRole(document.body, 'heading', { name: 'Request validation failed' })
  ).toBeInTheDocument()
  expect(
    getByText(document.body, 'Your request could not be verified. Please try again.')
  ).toBeInTheDocument()
})
