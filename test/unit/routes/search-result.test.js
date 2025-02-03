import { startServer } from '../../../src/utils/start-server.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths, queryStringParams } from '../../../src/routes/route-constants.js'
import { performSearch } from '../../../src/services/index.js'
import { createSearchResultsModel } from '../../../src/models/index.js'

jest.mock('../../../src/services/index.js', () => ({
  performSearch: jest.fn()
}))
jest.mock('../../../src/models/index.js', () => ({
  createSearchResultsModel: jest.fn()
}))

describe('#serveSearchResultsPage', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      server = await startServer()
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
        url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${testSearchTerm}`
      })

      expect(performSearch).toHaveBeenCalledWith(testSearchTerm)
      expect(createSearchResultsModel).toHaveBeenCalledWith(testSearchResult)
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(payload).toEqual(expect.stringContaining(`Search result - ${config.get(configKeys.SERVICE_NAME)}`))
    })
  })
})
