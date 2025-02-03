import { startServer } from '../../../src/utils/start-server.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths, queryStringParams } from '../../../src/routes/route-constants.js'

describe('#serveSearchPage', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should respond with search page', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.SEARCH
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toEqual(expect.stringContaining(`Search - ${config.get(configKeys.SERVICE_NAME)}`))
    })

    test('Should redirect to search results page', async () => {
      const testChedRef = 'CHEDP.GB.2024.1234567'
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: paths.SEARCH,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        payload: `searchTerm=${testChedRef}`
      })
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(`${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${testChedRef}`)
    })
  })
})
