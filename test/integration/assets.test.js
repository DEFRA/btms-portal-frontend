import { initialiseServer } from '../utils/initialise-server.js'

test('does not return favicon from route', async () => {
  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: '/favicon.ico'
  })

  expect(statusCode).toBe(204)
})

test('returns rebrand favicon', async () => {
  const server = await initialiseServer()

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: '/public/assets/rebrand/images/favicon.ico'
  })

  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('image/x-icon')
})
