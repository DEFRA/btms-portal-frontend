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

    test.each([
      { searchTerm: '', validSearchTerm: false, expectedValidSearchTermCall: false, expectedErrorCode: 'INVALID_SEARCH_TERM' },
      { searchTerm: 'FOO', validSearchTerm: false, expectedValidSearchTermCall: true, expectedErrorCode: 'INVALID_SEARCH_TERM' },
      { searchTerm: 'CHEDP.GB.2024.1234567', validSearchTerm: true, expectedValidSearchTermCall: true, expectedErrorCode: 'SEARCH_TERM_NOT_FOUND' }
    ])('Should return search page with error', async ({ searchTerm, validSearchTerm, expectedValidSearchTermCall, expectedErrorCode }) => {
      isValidSearchTerm.mockReturnValue(validSearchTerm)
      hasSearchResult.mockReturnValue(false)

      const { statusCode, request } = await server.inject({
        method: 'POST',
        url: paths.SEARCH,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        payload: `searchTerm=${searchTerm}`
      })

      expectedValidSearchTermCall ? expect(isValidSearchTerm).toHaveBeenCalledWith(searchTerm) : expect(isValidSearchTerm).not.toHaveBeenCalled()
      validSearchTerm ? expect(hasSearchResult).toHaveBeenCalledWith(searchTerm) : expect(hasSearchResult).not.toHaveBeenCalled()
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
      expect(request.response.source.template).toBe('search')
      expect(request.response.source.context.searchTerm).toBe(searchTerm)
      expect(request.response.source.context.isValid).toBeFalsy()
      expect(request.response.source.context.errorCode).toBe(expectedErrorCode)
    })
  })
})
