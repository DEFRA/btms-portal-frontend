import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByText, queryByText } from '@testing-library/dom'
import { paths } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedAdminUserSession, setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const DEAD_LETTER_QUEUE_COUNT_RESULT = { deadLetterQueueCount: 0 }

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('Accessing Redrive Confirmation page for an unknown DLQ should not show Redrive page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_REDRIVE}?queue=some_unconfigured_deadletter_queue`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(302)

  expect(
    queryByText(document.body, 'Redrive Messages')
  ).not.toBeInTheDocument()
})

test('Should show Redrive Confirmation page if valid redrive queue requested', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_REDRIVE}?queue=trade_imports_data_upserted_btms-gateway-deadletter`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByText(document.body, 'Redrive Messages')
  ).toBeInTheDocument()
})

test.each([
  `${paths.ADMIN_REDRIVE}`,
  `${paths.ADMIN_REDRIVE}?queue=foo`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_data_upserted_btms-gateway-deadletter`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_inbound_customs_declarations_processor-deadletter.fifo`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_data_upserted_processor-deadletter`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_data_upserted_reporting_api-deadletter`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_btms_activity_reporting_api-deadletter`,
  `${paths.ADMIN_REDRIVE}?queue=trade_imports_data_upserted_decision_deriver-deadletter`
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
