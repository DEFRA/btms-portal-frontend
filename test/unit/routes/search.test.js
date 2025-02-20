import { startServer } from '../../../src/utils/start-server.js'
import { isValidSearchTerm, hasSearchResult } from '../../../src/services/search-service.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths, queryStringParams } from '../../../src/routes/route-constants.js'

jest.mock('../../../src/services/search-service.js')

describe('#serveSearchPage', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
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

    test('Should redirect to search results page when search has results', async () => {
      isValidSearchTerm.mockReturnValue(true)
      hasSearchResult.mockReturnValue(true)

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

    test('Should return search page with invalid search term error when search term is empty', async () => {
      isValidSearchTerm.mockReturnValue(false)

      const emptySearchTerm = ''
      const { statusCode, request } = await server.inject({
        method: 'POST',
        url: paths.SEARCH,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        payload: `searchTerm=${emptySearchTerm}`
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(request.response.source.template).toBe('search')
      expect(request.response.source.context.searchTerm).toBe(emptySearchTerm)
      expect(request.response.source.context.isValid).toBeFalsy()
      expect(request.response.source.context.errorCode).toBe('INVALID_SEARCH_TERM')
    })

    test('Should return search page with invalid search term error when search term is not a valid MRN or CHED', async () => {
      isValidSearchTerm.mockReturnValue(false)

      const invalidSearchTerm = 'FOO'
      const { statusCode, request } = await server.inject({
        method: 'POST',
        url: paths.SEARCH,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        payload: `searchTerm=${invalidSearchTerm}`
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(request.response.source.template).toBe('search')
      expect(request.response.source.context.searchTerm).toBe(invalidSearchTerm)
      expect(request.response.source.context.isValid).toBeFalsy()
      expect(request.response.source.context.errorCode).toBe('INVALID_SEARCH_TERM')
    })

    test('Should return search page with search term not found error when search has no results', async () => {
      isValidSearchTerm.mockReturnValue(true)
      hasSearchResult.mockReturnValue(false)

      const testChedRef = 'CHEDP.GB.2024.1234567'
      const { statusCode, request } = await server.inject({
        method: 'POST',
        url: paths.SEARCH,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        payload: `searchTerm=${testChedRef}`
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(request.response.source.template).toBe('search')
      expect(request.response.source.context.searchTerm).toBe(testChedRef)
      expect(request.response.source.context.isValid).toBeFalsy()
      expect(request.response.source.context.errorCode).toBe('SEARCH_TERM_NOT_FOUND')
    })
  })
})
