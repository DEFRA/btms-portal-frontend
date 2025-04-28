import { startServer } from '../../../src/utils/start-server.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths, queryStringParams } from '../../../src/routes/route-constants.js'
import { performSearch } from '../../../src/services/index.js'
import { createSearchResultsModel } from '../../../src/models/index.js'
import { setupAuthedUserSession } from '../utils/session-helper.js'

jest.mock('../../../src/services/index.js', () => ({
  performSearch: jest.fn()
}))
jest.mock('../../../src/models/index.js', () => ({
  createSearchResultsModel: jest.fn()
}))

describe('#serveSearchResultsPage', () => {
  let server, userSession

  describe('When authenticated', () => {
    beforeEach(async () => {
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should respond with search results', async () => {
      const testSearchTerm = '24GBD46UUIIVQABCD1'
      const testSearchResult = { id: '24GBD46UUIIVQABCD1' }
      performSearch.mockReturnValue(testSearchResult)
      createSearchResultsModel.mockReturnValue({
        searchTerm: '24GBD46UUIIVQABCD1',
        searchType: 'customs-declaration',
        customsDeclarations: [],
        preNotifications: []
      })

      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${testSearchTerm}`,
        auth: {
          strategy: 'session',
          credentials: userSession
        }
      })

      expect(performSearch).toHaveBeenCalledWith(testSearchTerm)
      expect(createSearchResultsModel).toHaveBeenCalledWith(testSearchResult)
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toEqual(expect.stringContaining(`Search result - ${config.get(configKeys.SERVICE_NAME)}`))
    })

    describe('#When route is requested', () => {
      test('Should return non caching headers', async () => {
        const { headers } = await server.inject({
          method: 'GET',
          url: paths.SEARCH_RESULT
        })

        expect(headers['cache-control']).toEqual('no-store')
      })
    })
  })

  describe('When not authenticated', () => {
    beforeEach(async () => {
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should respond with unauthorized', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.SEARCH_RESULT
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_UNAUTHORIZED)
      expect(payload).toEqual(expect.stringContaining(`Unauthorized - ${config.get(configKeys.SERVICE_NAME)}`))
    })
  })
})
