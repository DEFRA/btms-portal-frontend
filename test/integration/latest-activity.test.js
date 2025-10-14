import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { getByRole } from '@testing-library/dom'

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

test('latest activity', async () => {
  const lastSentData = {
    decision: {
      timestamp: '2025-10-13T11:44:56.487Z',
      reference: '25GBV2WICDPV7YZXXX'
    }
  }
  const lastReceivedData = {
    finalisation: {
      timestamp: '2025-10-13T11:44:18.745Z',
      reference: '25GBVJL5U6P538LXXX'
    },
    clearanceRequest: {
      timestamp: '2025-10-13T11:44:56.291Z',
      reference: '25GBV2WICDPV7YZXXX'
    },
    preNotification: {
      timestamp: '2025-10-13T11:44:56.296Z',
      reference: 'CHEDA.GB.1558.9999999'
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: lastSentData })
    .mockResolvedValueOnce({ payload: lastReceivedData })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.LATEST_ACTIVITY}`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(
    getByRole(document.body, 'heading', { name: 'BTMS' })
  ).toBeInTheDocument()

  const btmsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for BTMS'
  })
  expect(
    getByRole(btmsTable, 'columnheader', { name: 'Last sent' })
  ).toBeInTheDocument()
  expect(
    getByRole(btmsTable, 'row', { name: 'Decision 13 October 2025, 11:44' })
  ).toBeInTheDocument()

  const cdsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for CDS'
  })
  expect(
    getByRole(cdsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', {
      name: 'Clearance request 13 October 2025, 11:44'
    })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', { name: 'Finalisation 13 October 2025, 11:44' })
  ).toBeInTheDocument()

  const ipaffsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for IPAFFS'
  })
  expect(
    getByRole(ipaffsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(ipaffsTable, 'row', {
      name: 'Notification 13 October 2025, 11:44'
    })
  ).toBeInTheDocument()
})

test('handles upstream errors', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, statusCode } = await server.inject({
    method: 'get',
    url: paths.LATEST_ACTIVITY,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(
    getByRole(document.body, 'heading', {
      name: 'Sorry, there is a problem with this service'
    })
  ).toBeInTheDocument()
})

test('redirect non authorised requests', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: paths.LATEST_ACTIVITY
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/sign-in-choose')
})
