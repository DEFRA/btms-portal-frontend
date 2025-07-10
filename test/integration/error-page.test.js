import boom from '@hapi/boom'
import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'

test('400: bad request', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-bad-request-error',
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
  expect(document.title)
    .toBe('Sorry, there is a problem with this service - Border Trade Matching Service')
})

test('401: unauthorized', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-unauthorized-error',
    handler: (_request, h) => boom.unauthorized()
  })

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: '/simulate-unauthorized-error'
  })

  globalJsdom(payload)

  expect(statusCode).toBe(401)
  getByRole(document.body, 'heading', {
    name: 'Sign in'
  })
  expect(document.title)
    .toBe('Sign in - Border Trade Matching Service')
})

test('403: forbidden', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'GET',
    path: '/simulate-forbidden-error',
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
  expect(document.title)
    .toBe('You do not have the correct permissions to access this service - Border Trade Matching Service')
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
  expect(document.title)
    .toBe('Page not found - Border Trade Matching Service')
})

test('500: internal server error', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-error',
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
  expect(document.title)
    .toBe('Sorry, there is a problem with this service - Border Trade Matching Service')
})

test('502: bad gateway', async () => {
  const server = await initialiseServer()
  server.route({
    method: 'get',
    path: '/simulate-upstream-error',
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
  expect(document.title)
    .toBe('Sorry, there is a problem with this service - Border Trade Matching Service')
})
