import boom from '@hapi/boom'
import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { createAuthedUser } from '../unit/utils/session-helper.js'

test('400: bad request', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-bad-request-error',
    options: {
      auth: false
    },
    handler: () => boom.badRequest()
  })

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/simulate-bad-request-error'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(400)
  getByRole(document.body, 'heading', {
    name: 'Sorry, there is a problem with this service'
  })
  expect(document.title).toBe(
    'Sorry, there is a problem with this service - Border Trade Matching Service'
  )
})

test('401: unauthorized should redirect to /signed-out', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-unauthorized-error',
    handler: (_request, h) => boom.unauthorized()
  })

  const { headers, statusCode } = await server.inject({
    method: 'get',
    url: '/simulate-unauthorized-error'
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toContain('/sign-in-choose')
})

test('403: forbidden', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'GET',
    path: '/simulate-forbidden-error',
    options: {
      auth: false
    },
    handler: () => boom.forbidden()
  })

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/simulate-forbidden-error'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(403)
  getByRole(document.body, 'heading', {
    name: 'You do not have the correct permissions to access this service'
  })
  expect(document.title).toBe(
    'You do not have the correct permissions to access this service - Border Trade Matching Service'
  )
  expect(document.body.textContent).not.toContain('Sign out')
})

test('404: not found', async () => {
  const server = await initialiseServer()
  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/non-existent-path'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(404)
  getByRole(document.body, 'heading', {
    name: 'Page not found'
  })
  expect(document.title).toBe('Page not found - Border Trade Matching Service')
  expect(document.body.textContent).not.toContain('Sign out')
})

test('500: internal server error', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-error',
    options: {
      auth: false
    },
    handler: () => boom.badImplementation()
  })

  const { payload, statusCode } = await server.inject({
    method: 'GET',
    url: '/simulate-error'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)
  getByRole(document.body, 'heading', {
    name: 'Sorry, there is a problem with this service'
  })
  expect(document.title).toBe(
    'Sorry, there is a problem with this service - Border Trade Matching Service'
  )
})

test('500: signed-in user sees the service menu bar', async () => {
  const server = await initialiseServer()
  const credentials = createAuthedUser(undefined, 'entraId')
  server.route({
    method: 'GET',
    path: '/simulate-error-nav',
    options: { auth: 'session' },
    handler: () => boom.badImplementation()
  })

  const { payload } = await server.inject({
    method: 'get',
    url: '/simulate-error-nav',
    auth: { strategy: 'session', credentials }
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'navigation', { name: 'Menu' })).toBeDefined()
  expect(getByRole(document.body, 'link', { name: 'Sign out' })).toBeDefined()
})

test('403: user without permission gets the bar with Sign out', async () => {
  const server = await initialiseServer()
  const credentials = createAuthedUser(undefined, 'entraId')
  server.route({
    method: 'GET',
    path: '/simulate-forbidden-error-no-permission',
    options: { auth: false },
    handler: () => boom.forbidden()
  })

  const { payload } = await server.inject({
    method: 'get',
    url: '/simulate-forbidden-error-no-permission',
    auth: { strategy: 'session', credentials }
  })

  globalJsdom(payload)

  expect(document.querySelector('.govuk-service-navigation')).not.toBeNull()
  expect(
    getByRole(document.body, 'link', { name: 'Sign out' }).getAttribute('href')
  ).toBe('/sign-out?provider=entraId')
  expect(document.getElementById('navigation')).toBeNull()
})

test('404: inline script carries the CSP nonce', async () => {
  const server = await initialiseServer()
  const { payload, headers } = await server.inject({
    method: 'get',
    url: '/non-existent-path'
  })

  const nonce = /'nonce-([^']+)'/.exec(
    headers['content-security-policy']
  )[1]

  expect(payload).toContain(`<script nonce="${nonce}">`)
})

test('502: bad gateway', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-upstream-error',
    options: {
      auth: false
    },
    handler: () => boom.badGateway()
  })

  const { payload, statusCode } = await server.inject({
    method: 'GET',
    url: '/simulate-upstream-error'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(502)
  getByRole(document.body, 'heading', {
    name: 'Sorry, there is a problem with this service'
  })
  expect(document.title).toBe(
    'Sorry, there is a problem with this service - Border Trade Matching Service'
  )
})
