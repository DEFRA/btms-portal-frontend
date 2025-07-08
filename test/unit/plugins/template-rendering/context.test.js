import { context } from '../../../../src/plugins/template-renderer/context'
import { config } from '../../../../src/config/config.js'

const mockGetUserSession = jest.fn()

jest.mock('../../../../src/auth/user-session.js', () => ({
  getUserSession: () => mockGetUserSession()
}))

jest.mock('node:fs', () => ({
  readFileSync: jest.fn().mockReturnValue(JSON.stringify({
    'application.js': 'javascripts/application.HASH.js'
  }))
}))

test('logged in: defraId', async () => {
  mockGetUserSession.mockReturnValue({
    strategy: 'defraId',
    isAuthenticated: true
  })

  const expected = {
    assetPath: '/public/assets',
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName: 'Border Trade Matching Service',
      navigation: [
        {
          text: 'Manage account',
          href: '#'
        },
        { text: 'Sign out', href: '/sign-out?provider=defraId' }
      ]
    },
    getAssetPath: expect.any(Function)
  }

  const result = await context({})

  expect(result).toEqual(expected)
})

test('logged in: entraId', async () => {
  mockGetUserSession.mockReturnValue({
    strategy: 'entraId',
    isAuthenticated: true
  })

  const expected = {
    assetPath: '/public/assets',
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName: 'Border Trade Matching Service',
      navigation: [
        { text: 'Sign out', href: '/sign-out?provider=entraId' }
      ]
    },
    getAssetPath: expect.any(Function)
  }

  const result = await context({})

  expect(result).toEqual(expected)
})

test('not logged in', async () => {
  mockGetUserSession.mockReturnValue(null)

  const request = {
    logger: { error: jest.fn() }
  }

  const expected = {
    assetPath: '/public/assets',
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName: 'Border Trade Matching Service',
      navigation: []
    },
    getAssetPath: expect.any(Function)
  }

  const result = await context(request)

  expect(result).toEqual(expected)
})

test('getAssetPath(): returns hashed path', async () => {
  mockGetUserSession.mockReturnValue(null)
  config.set('assetPath', '/test')

  const { getAssetPath } = await context({})

  expect(getAssetPath('application.js'))
    .toBe('/test/javascripts/application.HASH.js')
})

test('getAssetPath(): logs error for unmapped files', async () => {
  mockGetUserSession.mockReturnValue(null)
  config.set('assetPath', '/test')

  const request = {
    logger: { error: jest.fn() }
  }

  const { getAssetPath } = await context(request)

  expect(getAssetPath('not-built-with-webpack.js'))
    .toBe('/test/undefined')
  expect(request.logger.error.mock.calls).toEqual([
    ['Asset not-built-with-webpack.js not found in manifest']
  ])
})
