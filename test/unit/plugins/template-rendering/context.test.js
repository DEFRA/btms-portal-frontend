import { createAuthedUser } from '../../utils/session-helper.js'
import { getUserSession } from '../../../../src/auth/user-session.js'

const mockReadFileSync = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: () => mockReadFileSync()
}))
jest.mock('../../../../src/utils/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

jest.mock('../../../../src/auth/user-session.js', () => ({
  getUserSession: jest.fn()
}))

describe('#context', () => {
  const mockRequest = { path: '/' }
  let contextResult

  describe('When webpack manifest file read succeeds', () => {
    let contextImport, authedUser

    beforeAll(async () => {
      contextImport = await import('../../../../src/plugins/template-renderer/context.js')

      authedUser = createAuthedUser()
      getUserSession.mockReturnValue(authedUser)
    })

    beforeEach(async () => {
      // Return JSON string
      mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

      contextResult = await contextImport.context(mockRequest)
    })

    test('Should read file', () => {
      expect(mockReadFileSync).toHaveBeenCalled()
    })

    test('Should use cache', () => {
      expect(mockReadFileSync).not.toHaveBeenCalled()
    })

    test('Should provide expected context', () => {
      expect(contextResult).toEqual({
        authedUser,
        assetPath: '/public/assets',
        getAssetPath: expect.any(Function),
        serviceName: 'Border Trade Matching Service',
        signOutUrl: '/sign-out'
      })
    })

    describe('With valid asset path', () => {
      test('Should provide expected asset path', () => {
        expect(contextResult.getAssetPath('application.js')).toBe(
          '/public/javascripts/application.js'
        )
      })
    })

    describe('With invalid asset path', () => {
      test('Should provide expected asset', () => {
        expect(contextResult.getAssetPath('an-image.png')).toBe(
          '/public/an-image.png'
        )
      })
    })
  })

  describe('When webpack manifest file read fails', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('../../../../src/plugins/template-renderer/context.js')
    })

    beforeEach(() => {
      mockReadFileSync.mockReturnValue(new Error('File not found'))

      contextResult = contextImport.context(mockRequest)
    })

    test('Should log that the Webpack Manifest file is not available', () => {
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Webpack assets-manifest.json not found'
      )
    })
  })
})
