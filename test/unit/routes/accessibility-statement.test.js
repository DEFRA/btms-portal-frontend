import { startServer } from '../../../src/utils/start-server.js'
import { paths } from '../../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'

describe('#accessibilityStatement', () => {
  describe('When accessed', () => {
    let server

    beforeEach(async () => {
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should display the accessibility statement page', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.ACCESSIBILITY
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toContain('Accessibility statement')
    })
  })
})
