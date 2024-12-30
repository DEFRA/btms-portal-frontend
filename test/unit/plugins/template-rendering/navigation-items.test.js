import { getNavigationItems } from '~/src/config/navigation-items.js'

/**
 * @param {Partial<Request>} [testPath]
 */
function createMockRequest(testPath) {
  return { path: testPath }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(getNavigationItems(createMockRequest('/non-existent-path'))).toEqual(
      [
        {
          isActive: false,
          text: 'Home',
          url: '/'
        }
      ]
    )
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(getNavigationItems(createMockRequest('/'))).toEqual([
      {
        isActive: true,
        text: 'Home',
        url: '/'
      }
    ])
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
