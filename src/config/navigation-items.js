/**
 * @param {Partial<Request> | null} request
 */
export function getNavigationItems (request) {
  return [
    {
      text: 'Home',
      url: '/',
      isActive: request?.path === '/'
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
