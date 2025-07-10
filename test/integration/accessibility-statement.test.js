import { paths } from '../../src/routes/route-constants.js'
import { getByRole } from '@testing-library/dom'
import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'

test('accessibility statement', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.ACCESSIBILITY
  })

  globalJsdom(payload)

  getByRole(document.body, 'heading', { name: 'Accessibility statement' })
  expect(document.title).toBe('Accessibility statement - Border Trade Matching Service')
})
