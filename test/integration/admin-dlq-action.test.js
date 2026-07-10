import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByRole, getByText, queryByRole } from '@testing-library/dom'
import { paths } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedAdminUserSession, setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const DEAD_LETTER_QUEUE_COUNT_RESULT = { deadLetterQueueCount: 0 }

jest.mock('@hapi/wreck', () => ({
  get: jest.fn(),
  post: jest.fn(),
  read: jest.fn()
}))

test('Accessing Dead Letter Action Confirmation page for an unknown DLQ should not show Action page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_DLQ_ACTION}?queue=some_unconfigured_deadletter_queue`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.ADMIN_DLQ)
})

test('Should show Action Confirmation page if valid queue requested', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: DEAD_LETTER_QUEUE_COUNT_RESULT })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_btms-gateway-deadletter`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByRole(document.body, 'heading', { name: 'Dead letter actions' })
  ).toBeInTheDocument()

  expect(
    queryByRole(document.body, 'button', { name: 'Redrive messages' })
  ).not.toBeInTheDocument()
  expect(
    queryByRole(document.body, 'button', { name: 'Drain messages from queue' })
  ).not.toBeInTheDocument()
})

test.each([
  `${paths.ADMIN_DLQ_ACTION}`,
  `${paths.ADMIN_DLQ_ACTION}?queue=foo`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_btms-gateway-deadletter&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_inbound_customs_declarations_processor-deadletter.fifo&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_processor-deadletter&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_reporting_api-deadletter&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_btms_activity_reporting_api-deadletter&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_decision_deriver-deadletter&action=Redrive`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_btms-gateway-deadletter&action=Drain`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_inbound_customs_declarations_processor-deadletter.fifo&action=Drain`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_processor-deadletter&action=Drain`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_reporting_api-deadletter&action=Drain`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_btms_activity_reporting_api-deadletter&action=Drain`,
  `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_decision_deriver-deadletter&action=Drain`
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

test.each([
  'trade_imports_data_upserted_btms-gateway-deadletter',
  'trade_imports_inbound_customs_declarations_processor-deadletter.fifo',
  'trade_imports_data_upserted_processor-deadletter',
  'trade_imports_data_upserted_reporting_api-deadletter',
  'trade_imports_btms_activity_reporting_api-deadletter',
  'trade_imports_data_upserted_decision_deriver-deadletter'
])('Successful Redrive request should redirect to action complete', async (dlq) => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue(`{ "confirmActionQueue": "${dlq}", "confirmAction": "Redrive" }`)

  const mockPostRedriveResponse = {
    res: { statusCode: 202 }
  };

  wreck.post.mockResolvedValueOnce(mockPostRedriveResponse);

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { headers, statusCode } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: dlq,
      confirmAction: 'Redrive'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(`${paths.ADMIN_DLQ_ACTION_COMPLETE}?queue=${dlq}&action=Redrive`)
})

test.each([
  'trade_imports_data_upserted_btms-gateway-deadletter',
  'trade_imports_inbound_customs_declarations_processor-deadletter.fifo',
  'trade_imports_data_upserted_processor-deadletter',
  'trade_imports_data_upserted_reporting_api-deadletter',
  'trade_imports_btms_activity_reporting_api-deadletter',
  'trade_imports_data_upserted_decision_deriver-deadletter'
])('Successful Drain request should redirect to action complete', async (dlq) => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue(`{ "confirmActionQueue": "${dlq}", "confirmAction": "Drain" }`)

  const mockPostDrainResponse = {
    res: { statusCode: 200 }
  };

  wreck.post.mockResolvedValueOnce(mockPostDrainResponse);

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { headers, statusCode } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: dlq,
      confirmAction: 'Drain'
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(`${paths.ADMIN_DLQ_ACTION_COMPLETE}?queue=${dlq}&action=Drain`)
})

test('Post redrive failure should show error page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue('{ "confirmActionQueue": "trade_imports_data_upserted_btms-gateway-deadletter", "confirmAction": "Redrive" }')

  wreck.post.mockImplementation(() => {
    throw new Error();
  })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: 'trade_imports_data_upserted_btms-gateway-deadletter',
      confirmAction: 'Redrive'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' })
  ).toBeInTheDocument()
})

test('Post drain failure should show error page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue('{ "confirmActionQueue": "trade_imports_data_upserted_btms-gateway-deadletter", "confirmAction": "Drain" }')

  wreck.post.mockImplementation(() => {
    throw new Error();
  })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: 'trade_imports_data_upserted_btms-gateway-deadletter',
      confirmAction: 'Drain'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' })
  ).toBeInTheDocument()
})

test('Invalid DLQ action should show error page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue('{ "confirmActionQueue": "trade_imports_data_upserted_btms-gateway-deadletter", "confirmAction": "Foo" }')

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: 'trade_imports_data_upserted_btms-gateway-deadletter',
      confirmAction: 'Foo'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' })
  ).toBeInTheDocument()
})

test('Should show actions available if queue counts are greater than zero', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: { deadLetterQueueCount: 1 } })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: `${paths.ADMIN_DLQ_ACTION}?queue=trade_imports_data_upserted_btms-gateway-deadletter`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(200)

  expect(
    getByRole(document.body, 'button', { name: 'Redrive messages' })
  ).toBeInTheDocument()
  expect(
    getByRole(document.body, 'button', { name: 'Drain messages from queue' })
  ).toBeInTheDocument()
})

test('Invalid Redrive response should show error page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue('{ "confirmActionQueue": "trade_imports_data_upserted_btms-gateway-deadletter", "confirmAction": "Redrive" }')

  wreck.post.mockImplementation(() => {
    return {
      res: {
        statusCode: 500,
        statusMessage: 'Error occurred'
      }
    }
  })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: 'trade_imports_data_upserted_btms-gateway-deadletter',
      confirmAction: 'Drain'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' })
  ).toBeInTheDocument()
})

test('Invalid Drain response should show error page', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  wreck.read.mockResolvedValue('{ "confirmActionQueue": "trade_imports_data_upserted_btms-gateway-deadletter", "confirmAction": "Drain" }')

  wreck.post.mockImplementation(() => {
    return {
      res: {
        statusCode: 500,
        statusMessage: 'Error occurred'
      }
    }
  })

  const server = await initialiseServer()
  const credentials = await setupAuthedAdminUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'post',
    url: paths.ADMIN_DLQ_ACTION,
    auth: {
      strategy: 'session',
      credentials
    },
    payload: {
      confirmActionQueue: 'trade_imports_data_upserted_btms-gateway-deadletter',
      confirmAction: 'Drain'
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' })
  ).toBeInTheDocument()
})
