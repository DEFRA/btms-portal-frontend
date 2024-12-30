import { constants as httpConstants } from 'http2'
import { startServer } from '~/src/utils/start-server.js'

describe('#serveStaticFiles', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should serve favicon as expected', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_NO_CONTENT)
    })

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/public/assets/images/govuk-crest.svg'
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })
  })
})
