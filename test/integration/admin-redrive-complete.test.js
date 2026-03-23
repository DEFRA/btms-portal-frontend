import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import {
  setupAuthedAdminUserSession,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import globalJsdom from 'global-jsdom'
import { getByRole, getByText } from '@testing-library/dom'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('Accessing redrive complete page should show successful confirmation', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_REDRIVE_COMPLETE}?queue=trade_imports_data_upserted_btms-gateway-deadletter`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByRole(document.body, 'heading', { name: 'Redrive Request Successful' })
  ).toBeInTheDocument()

  expect(getByRole(document.body, 'button', { name: 'Return to Admin page' }))
    .toHaveAttribute('href', paths.ADMIN_DLQ)
})

test.each([
  `${paths.ADMIN_REDRIVE_COMPLETE}`,
  `${paths.ADMIN_REDRIVE_COMPLETE}?queue=foo`,
])('Should show the forbidden page when the user is not in the admin security group', async (requestedPage) => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: requestedPage,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByText(document.body, 'You do not have the correct permissions to access this service')
  ).toBeInTheDocument()
})
