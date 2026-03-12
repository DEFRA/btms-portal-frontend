import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByRole, getByText } from '@testing-library/dom'
import { paths } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedAdminUserSession, setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT = { deadLetterQueueCount: 1 }
const DEAD_LETTER_QUEUE_COUNT_RESULT = { deadLetterQueueCount: 0 }

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('Should render the admin redrive page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.ADMIN_DLQ,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByText(document.body, 'Dead letter queues')
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'BTMS Gatewaytrade_imports_data_upserted_btms-gateway-deadletter 0'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Customs Declarations Processortrade_imports_inbound_customs_declarations_processor-deadletter.fifo 0'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Upserted Processortrade_imports_data_upserted_processor-deadletter 0'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Upserted Reporting APItrade_imports_data_upserted_reporting_api-deadletter 0'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Activity Reporting APItrade_imports_btms_activity_reporting_api-deadletter 0'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Decision Derivertrade_imports_data_upserted_decision_deriver-deadletter 0'
    })
  ).toBeInTheDocument()
})

test('Should render the admin dlq page with Take Action links when DLQ count is greater than 0', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_EXISTS_RESULT })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.ADMIN_DLQ,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByText(document.body, 'Dead letter queues')
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'BTMS Gatewaytrade_imports_data_upserted_btms-gateway-deadletter 1 Take Action'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Customs Declarations Processortrade_imports_inbound_customs_declarations_processor-deadletter.fifo 1 Take Action'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Upserted Processortrade_imports_data_upserted_processor-deadletter 1 Take Action'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Upserted Reporting APItrade_imports_data_upserted_reporting_api-deadletter 1 Take Action'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Activity Reporting APItrade_imports_btms_activity_reporting_api-deadletter 1 Take Action'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(document.body, 'row', {
      name: 'Decision Derivertrade_imports_data_upserted_decision_deriver-deadletter 1 Take Action'
    })
  ).toBeInTheDocument()
})

test.each([
  `${paths.ADMIN_DLQ}`
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
