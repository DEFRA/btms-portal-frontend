import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'

test('not authenticated', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SIGNED_OUT
  })

  globalJsdom(payload)

  expect(getByRole(document.body, 'link', { name: 'Sign in' }))
    .toHaveAttribute('href', '/sign-in')
})
