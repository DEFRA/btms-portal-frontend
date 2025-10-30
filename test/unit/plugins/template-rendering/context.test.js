import { context } from '../../../../src/plugins/template-renderer/context'
import { config } from '../../../../src/config/config.js'

const mockGetUserSession = jest.fn()

jest.mock('../../../../src/auth/user-session.js', () => ({
  getUserSession: () => mockGetUserSession()
}))

jest.mock('node:fs', () => ({
  readFileSync: jest.fn().mockReturnValue(
    JSON.stringify({
      'application.js': 'javascripts/application.HASH.js'
    })
  )
}))

test('logged in', async () => {
  mockGetUserSession.mockReturnValue({
    strategy: 'defraId',
    isAuthenticated: true
  })

  const expected = {
    assetPath: '/public/assets',
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName: 'Border Trade Matching Service'
    },
    navigation: [
      {
        href: '/search',
        text: 'Search',
        active: true
      },
      {
        href: '/reporting',
        text: 'Reporting',
        active: false
      },
      {
        href: '/latest-activity',
        text: 'Latest activity',
        active: false
      },
      {
        href: '/admin/view',
        text: 'Admin view',
        active: false
      }
    ],
    accountNavigation: [
      {
        href: '#',
        text: 'Manage account'
      },
      {
        href: '/sign-out',
        text: 'Sign out'
      }
    ],
    getAssetPath: expect.any(Function)
  }

  const result = await context({ url: { pathname: '/search' } })

  expect(result).toEqual(expected)
})

test('not logged in', async () => {
  mockGetUserSession.mockReturnValue(null)

  const request = {
    url: { pathname: '/reporting' },
    logger: { error: jest.fn() }
  }

  const expected = {
    assetPath: '/public/assets',
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName: 'Border Trade Matching Service'
    },
    navigation: [
      {
        href: '/search',
        text: 'Search',
        active: false
      },
      {
        href: '/reporting',
        text: 'Reporting',
        active: true
      },
      {
        href: '/latest-activity',
        text: 'Latest activity',
        active: false
      },
      {
        href: '/admin/view',
        text: 'Admin view',
        active: false
      }
    ],
    accountNavigation: [],
    getAssetPath: expect.any(Function)
  }

  const result = await context(request)

  expect(result).toEqual(expected)
})

test('getAssetPath(): returns hashed path', async () => {
  mockGetUserSession.mockReturnValue(null)
  config.set('assetPath', '/test')

  const { getAssetPath } = await context({ url: {} })

  expect(getAssetPath('application.js')).toBe(
    '/test/javascripts/application.HASH.js'
  )
})

test('getAssetPath(): logs error for unmapped files', async () => {
  mockGetUserSession.mockReturnValue(null)
  config.set('assetPath', '/test')

  const request = {
    url: {},
    logger: { error: jest.fn() }
  }

  const { getAssetPath } = await context(request)

  expect(getAssetPath('not-built-with-webpack.js')).toBe('/test/undefined')
  expect(request.logger.error.mock.calls).toEqual([
    ['Asset not-built-with-webpack.js not found in manifest']
  ])
})
