import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'

const getSessionCookie = ({ headers }) => headers['set-cookie'][0].split(';')[0]

test('back link pages maintain history', async () => {
  const server = await initialiseServer(null, true)
  const credentials = await setupAuthedUserSession(server)

  const searchPage = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?some=query`,
    auth: {
      strategy: 'session',
      credentials
    }
  })
  let cookie = getSessionCookie(searchPage)

  expect(searchPage.request.yar.get('current')).toEqual({
    path: '/search',
    queryString: '?some=query'
  })
  expect(searchPage.request.yar.get('history')).toEqual([])

  const cookiesPage = await server.inject({
    method: 'get',
    url: paths.COOKIES,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })
  cookie = getSessionCookie(cookiesPage)

  expect(cookiesPage.request.yar.get('current')).toEqual({
    path: '/cookies',
    queryString: ''
  })
  expect(cookiesPage.request.yar.get('history')).toEqual([
    { path: '/search', queryString: '?some=query' }
  ])

  globalJsdom(cookiesPage.payload)
  expect(getByRole(document.body, 'link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/search?some=query&backLink=true'
  )

  const accessibilityPage = await server.inject({
    method: 'get',
    url: paths.ACCESSIBILITY,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })
  cookie = getSessionCookie(accessibilityPage)

  expect(accessibilityPage.request.yar.get('current')).toEqual({
    path: '/accessibility-statement',
    queryString: ''
  })
  expect(accessibilityPage.request.yar.get('history')).toEqual([
    { path: '/search', queryString: '?some=query' },
    { path: '/cookies', queryString: '' }
  ])

  document.body.innerHTML = accessibilityPage.payload
  expect(getByRole(document.body, 'link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/cookies?backLink=true'
  )

  const backLinkedCookiePage = await server.inject({
    method: 'get',
    url: `${paths.COOKIES}?backLink=true`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })
  cookie = getSessionCookie(backLinkedCookiePage)

  expect(backLinkedCookiePage.request.yar.get('current')).toEqual({
    path: '/cookies',
    queryString: '?backLink=true'
  })
  expect(backLinkedCookiePage.request.yar.get('history')).toEqual([
    { path: '/search', queryString: '?some=query' }
  ])

  document.body.innerHTML = backLinkedCookiePage.payload
  expect(getByRole(document.body, 'link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/search?some=query&backLink=true'
  )

  const backLinkedSearchPage = await server.inject({
    method: 'get',
    url: `${paths.SEARCH}?backLink=true`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: { cookie }
  })
  await server.stop()

  expect(backLinkedSearchPage.request.yar.get('current')).toEqual({
    path: '/search',
    queryString: '?backLink=true'
  })
  expect(backLinkedSearchPage.request.yar.get('history')).toEqual([])
})
