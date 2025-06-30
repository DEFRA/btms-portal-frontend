import { paths } from '../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'

test('accessibility statement', async () => {
  const server = await initialiseServer()

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.ACCESSIBILITY
  })

  globalJsdom(payload)

  expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  expect(payload).toContain('Accessibility statement')
})
