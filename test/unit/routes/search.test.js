import { startServer } from '../../../src/utils/start-server.js'
import { isValidSearchTerm, hasSearchResult } from '../../../src/services/search-service.js'
import { constants as httpConstants } from 'http2'
import { config, configKeys } from '../../../src/config/config.js'
import { paths, queryStringParams } from '../../../src/routes/route-constants.js'
import { setupAuthedUserSession } from '../utils/session-helper.js'

jest.mock('../../../src/services/search-service.js')

describe('#serveSearchPage', () => {
  let server, userSession

  describe('When authenticated', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      userSession = await setupAuthedUserSession(server)
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should respond with search page', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.SEARCH,
        auth: {
          strategy: 'defra-id',
          credentials: userSession
        }
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
        payload: `searchTerm=${testChedRef}`,
        auth: {
          strategy: 'defra-id',
          credentials: userSession
        }
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
        payload: `searchTerm=${searchTerm}`,
        auth: {
          strategy: 'defra-id',
          credentials: userSession
        }
      })

      expectedValidSearchTermCall ? expect(isValidSearchTerm).toHaveBeenCalledWith(searchTerm) : expect(isValidSearchTerm).not.toHaveBeenCalled()
      validSearchTerm ? expect(hasSearchResult).toHaveBeenCalledWith(searchTerm) : expect(hasSearchResult).not.toHaveBeenCalled()
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(request.response.headers.location).toBe('/search')
      const searchError = request.yar.flash('searchError')?.at(0) ?? {}
      expect(searchError.searchTerm).toEqual(searchTerm)
      expect(searchError.isValid).toBeFalsy()
      expect(searchError.errorCode).toBe(expectedErrorCode)
    })

    describe('#When route is requested', () => {
      test('Should return non caching headers', async () => {
        const { headers } = await server.inject({
          method: 'GET',
          url: paths.SEARCH
        })

        expect(headers['cache-control']).toEqual('no-store, no-cache, must-revalidate, max-age=0')
      })
    })
  })

  describe('When not authenticated', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should respond with unauthorized', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: paths.SEARCH
      })

      expect(statusCode).toBe(httpConstants.HTTP_STATUS_UNAUTHORIZED)
      expect(payload).toEqual(expect.stringContaining(`Unauthorized - ${config.get(configKeys.SERVICE_NAME)}`))
    })
  })
})
