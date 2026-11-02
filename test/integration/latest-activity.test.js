import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import { getByRole, queryByRole } from '@testing-library/dom'
import { config } from '../../src/config/config.js'

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

afterEach(() => {
  config.set('isTracesChedsEnabled', false)
})

const renderLatestActivity = async (lastReceivedData) => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: { decision: null } })
    .mockResolvedValueOnce({ payload: { decision: null } })
    .mockResolvedValueOnce({ payload: lastReceivedData })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LATEST_ACTIVITY,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)
}

test('latest activity', async () => {
  const lastCreatedData = {
    decision: {
      timestamp: '2025-10-13T11:43:56.487Z',
      reference: '25GBV2WICDPV7YZXXX'
    }
  }

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
      timestamp: '2025-10-13T11:44:57.296Z',
      reference: 'CHEDA.GB.1558.9999999'
    }
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: lastCreatedData })
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
    getByRole(btmsTable, 'columnheader', { name: 'Last updated' })
  ).toBeInTheDocument()
  expect(
    getByRole(btmsTable, 'row', { name: 'Decision created BTMS 13 October 2025, 11:43:56' })
  ).toBeInTheDocument()
  expect(
    getByRole(btmsTable, 'row', { name: 'Decision sent BTMS to CDS 13 October 2025, 11:44:56' })
  ).toBeInTheDocument()

  const cdsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for CDS'
  })
  expect(
    getByRole(cdsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', {
      name: 'Clearance request 13 October 2025, 11:44:56'
    })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', { name: 'Finalisation 13 October 2025, 11:44:18' })
  ).toBeInTheDocument()

  const ipaffsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for IPAFFS'
  })
  expect(
    getByRole(ipaffsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(ipaffsTable, 'row', {
      name: 'Notification 13 October 2025, 11:44:57'
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

test('handles no latest activity data', async () => {
  const lastCreatedData = {
    decision: null
  }

  const lastSentData = {
    decision: null
  }
  const lastReceivedData = {
    finalisation: null,
    clearanceRequest: null,
    preNotification: null
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: lastCreatedData })
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
    getByRole(btmsTable, 'columnheader', { name: 'Last updated' })
  ).toBeInTheDocument()
  expect(
    getByRole(btmsTable, 'row', { name: 'Decision created BTMS No Data Available' })
  ).toBeInTheDocument()
  expect(
    getByRole(btmsTable, 'row', { name: 'Decision sent BTMS to CDS No Data Available' })
  ).toBeInTheDocument()

  const cdsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for CDS'
  })
  expect(
    getByRole(cdsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', {
      name: 'Clearance request No Data Available'
    })
  ).toBeInTheDocument()
  expect(
    getByRole(cdsTable, 'row', { name: 'Finalisation No Data Available' })
  ).toBeInTheDocument()

  const ipaffsTable = getByRole(document.body, 'table', {
    name: 'Latest activity for IPAFFS'
  })
  expect(
    getByRole(ipaffsTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(ipaffsTable, 'row', {
      name: 'Notification No Data Available'
    })
  ).toBeInTheDocument()
})

test('shows the last TRACES CHED received when SHOW_TRACES_CHEDS is on', async () => {
  config.set('isTracesChedsEnabled', true)

  await renderLatestActivity({
    finalisation: null,
    clearanceRequest: null,
    preNotification: null,
    tracesChed: {
      timestamp: '2025-10-13T11:45:12.123Z',
      reference: 'CHEDP.GB.2025.1234567'
    }
  })

  expect(
    getByRole(document.body, 'heading', { name: 'TRACES' })
  ).toBeInTheDocument()

  const tracesTable = getByRole(document.body, 'table', {
    name: 'Latest activity for TRACES'
  })
  expect(
    getByRole(tracesTable, 'columnheader', { name: 'Last received' })
  ).toBeInTheDocument()
  expect(
    getByRole(tracesTable, 'row', {
      name: 'Notification 13 October 2025, 11:45:12'
    })
  ).toBeInTheDocument()
})

test('shows no TRACES CHED data when SHOW_TRACES_CHEDS is on and none has been received', async () => {
  config.set('isTracesChedsEnabled', true)

  await renderLatestActivity({
    finalisation: null,
    clearanceRequest: null,
    preNotification: null
  })

  const tracesTable = getByRole(document.body, 'table', {
    name: 'Latest activity for TRACES'
  })
  expect(
    getByRole(tracesTable, 'row', { name: 'Notification No Data Available' })
  ).toBeInTheDocument()
})

test('does not show TRACES when SHOW_TRACES_CHEDS is off', async () => {
  config.set('isTracesChedsEnabled', false)

  await renderLatestActivity({
    finalisation: null,
    clearanceRequest: null,
    preNotification: null,
    tracesChed: {
      timestamp: '2025-10-13T11:45:12.123Z',
      reference: 'CHEDP.GB.2025.1234567'
    }
  })

  expect(
    queryByRole(document.body, 'heading', { name: 'TRACES' })
  ).not.toBeInTheDocument()
  expect(
    queryByRole(document.body, 'table', { name: 'Latest activity for TRACES' })
  ).not.toBeInTheDocument()
})
