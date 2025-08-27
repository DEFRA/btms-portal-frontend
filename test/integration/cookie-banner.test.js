import globalJsdom from 'global-jsdom'
import { getByRole, queryByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('no cookiePolicy, the cookie banner is visible', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'region', {
      name: 'Cookies on Border Trade Matching Service'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'button', {
      name: 'Accept analytics cookies'
    })
  ).toHaveValue('yes')

  expect(
    getByRole(document.body, 'button', {
      name: 'Reject analytics cookies'
    })
  ).toHaveValue('no')
})

test('cookiePolicy exists, the cookie banner is not visible', async () => {
  const server = await initialiseServer()
  const { payload } = await server.inject({
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics":"yes"}').toString('base64')
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(
    queryByRole(document.body, 'region', {
      name: 'Cookies on Border Trade Matching Service'
    })
  ).not.toBeInTheDocument()
})

test('cookiePolicy exists & flash status exists, confirmation visible', async () => {
  const server = await initialiseServer({
    type: 'showCookieConfirmationBanner',
    message: true
  })

  const { payload } = await server.inject({
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics":"yes"}').toString('base64')
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'button', {
      name: 'Hide cookie message'
    })
  ).toBeInTheDocument()
})
