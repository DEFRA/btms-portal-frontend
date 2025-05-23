import { startServer } from '../../../src/utils/start-server.js'
import { createAuthedUser } from '../utils/session-helper.js'
import { paths } from '../../../src/routes/route-constants.js'
import { constants as httpConstants } from 'http2'
import { signinOidc } from '../../../src/routes/signin-oidc.js'

crypto.randomUUID = () => 'a-test-session-id'

describe('#signinOidc', () => {
  describe('When accessed following successful signin', () => {
    let server, userSession

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
      userSession = createAuthedUser()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should redirect to search page', async () => {
      const { statusCode, headers, request } = await server.inject({
        method: 'GET',
        url: paths.AUTH_DEFRA_ID_CALLBACK,
        auth: {
          strategy: 'defraId',
          credentials: userSession
        }
      })

      const cachedSession = await request.server.app.cache.get('a-test-session-id')

      expect(cachedSession).not.toBeNull()
      expect(cachedSession.isAuthenticated).toBeTruthy()
      expect(statusCode).toBe(httpConstants.HTTP_STATUS_FOUND)
      expect(headers.location).toContain(paths.SEARCH)
      expect(headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('userSession')
        ])
      )
    })
  })

  describe('When accessed following unsuccessful signin', () => {
    let server

    beforeEach(async () => {
      jest.clearAllMocks()
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test.each([
      { mockAuth: { isAuthenticated: false } },
      { mockAuth: null }
    ])('Should not set authed session and redirect to page', async ({ mockAuth }) => {
      const mockRedirect = jest.fn()

      const mockRequest = {
        server,
        yar: {
          flash: (referrer) => {
            return paths.SEARCH
          }
        },
        auth: mockAuth
      }
      const mockResponse = {
        redirect: mockRedirect
      }

      await signinOidc.handler(mockRequest, mockResponse)

      const cachedSession = await server.app.cache.get('a-test-session-id')

      expect(cachedSession).toBeNull()
      expect(mockRedirect).toHaveBeenCalledTimes(1)
    })
  })
})
