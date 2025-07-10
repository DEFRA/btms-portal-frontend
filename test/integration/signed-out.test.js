import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('signed out from defraId', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SIGNED_OUT}?provider=defraId`
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'link', { name: 'Sign in' }))
    .toHaveAttribute('href', '/sign-in')

  expect(document.title)
    .toBe('You are signed out - Border Trade Matching Service')
})

test('signed out from entraId', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SIGNED_OUT}?provider=entraId`
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'link', { name: 'Sign in' }))
    .toHaveAttribute('href', '/sign-in-entra')
})
