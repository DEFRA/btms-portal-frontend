import { initialiseServer } from '../utils/initialise-server.js'
import {
  setupAuthedAdminUserSession,
  setupAuthedPrivateBetaUserSession,
  setupAuthedUserSession
} from '../unit/utils/session-helper.js'
import { paths } from '../../src/routes/route-constants.js'
import globalJsdom from 'global-jsdom'
import { getByText } from '@testing-library/dom'
import wreck from '@hapi/wreck'
import { config } from '../../src/config/config.js'
import { prettyPrint } from '../../src/models/format.js'
import {
  initCopy
} from '../../src/client/javascripts/admin-environment-config.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

const loadPageAsUser = async (userSetupHandler, path) => {
  const server = await initialiseServer()
  const credentials = await userSetupHandler(server)

  const { payload } = await server.inject({
    method: 'get',
    url: path,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)
}

const decisionDeriverConfigPayload = '{ decisionDeriverConfig: "foo" }'

test.each([
  { userSetupHandler: setupAuthedUserSession },
  { userSetupHandler: setupAuthedPrivateBetaUserSession }
])('Should show the forbidden page when the user is not in the admin security group', async ({ userSetupHandler }) => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  await loadPageAsUser(userSetupHandler, paths.ADMIN_ENVIRONMENT_CONFIG)

  expect(
    getByText(document.body, 'You do not have the correct permissions to access this service')
  ).toBeInTheDocument()
})

test('should show Environment Config tab in Admin navigation', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_DLQ)

  const environmentConfigTab = document.body.querySelector(`a[href='${paths.ADMIN_ENVIRONMENT_CONFIG}'].btms-admin-dlq__tab`)
  expect(environmentConfigTab).toBeInTheDocument()

  expect(
    getByText(document.body, 'Environment Config')
  ).toBeInTheDocument()
})

test.each([
  {
    isTracesChedsEnabledFlag: true,
    expectedTracesChedsEnabledBadge: 'ON',
    isQuantityStatusEnabledFlag: true,
    expectedQuantityStatusEnabledBadge: 'ON'
  },
  {
    isTracesChedsEnabledFlag: false,
    expectedTracesChedsEnabledBadge: 'OFF',
    isQuantityStatusEnabledFlag: true,
    expectedQuantityStatusEnabledBadge: 'ON'
  },
  {
    isTracesChedsEnabledFlag: true,
    expectedTracesChedsEnabledBadge: 'ON',
    isQuantityStatusEnabledFlag: false,
    expectedQuantityStatusEnabledBadge: 'OFF'
  },
  {
    isTracesChedsEnabledFlag: false,
    expectedTracesChedsEnabledBadge: 'OFF',
    isQuantityStatusEnabledFlag: false,
    expectedQuantityStatusEnabledBadge: 'OFF'
  }
])('should show SHOW_TRACES_CHEDS "$expectedTracesChedsEnabledBadge" when isTracesChedsEnabled is "$isTracesChedsEnabledFlag" and SHOW_QUANTITY_STATUS "$expectedQuantityStatusEnabledBadge" when isQuantityStatusEnabled is "$isQuantityStatusEnabledFlag"',
  async ({ isTracesChedsEnabledFlag, expectedTracesChedsEnabledBadge, isQuantityStatusEnabledFlag, expectedQuantityStatusEnabledBadge}) => {
  config.set('isTracesChedsEnabled', isTracesChedsEnabledFlag)
  config.set('isQuantityStatusEnabled', isQuantityStatusEnabledFlag)

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: decisionDeriverConfigPayload })

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_ENVIRONMENT_CONFIG)

  const tracesChedsEnabledFlag = document.body.querySelector(`span[aria-label='SHOW_TRACES_CHEDS flag ${expectedTracesChedsEnabledBadge}']`)
  expect(tracesChedsEnabledFlag).toBeInTheDocument()
  expect(tracesChedsEnabledFlag.innerHTML).toBe(expectedTracesChedsEnabledBadge)

  const quantityStatusEnabledFlag = document.body.querySelector(`span[aria-label='SHOW_QUANTITY_STATUS flag ${expectedQuantityStatusEnabledBadge}']`)
  expect(quantityStatusEnabledFlag).toBeInTheDocument()
  expect(quantityStatusEnabledFlag.innerHTML).toBe(expectedQuantityStatusEnabledBadge)
})

test('shows Decision Deriver config JSON', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: decisionDeriverConfigPayload })

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_ENVIRONMENT_CONFIG)

  const decisionDeriverConfig = document.body.querySelector('code#decision-deriver-config-json')
  expect(decisionDeriverConfig).toBeInTheDocument()
  expect(decisionDeriverConfig.innerHTML).toBe(prettyPrint(decisionDeriverConfigPayload))

  const copyButton = document.body.querySelector('button#copy-json')
  expect(copyButton).toBeInTheDocument()
})

test('shows error message when Decision Deriver Config endpoint fails', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockRejectedValueOnce(new Error('boom'))

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_ENVIRONMENT_CONFIG)

  const decisionDeriverConfig = document.body.querySelector('div.btms-decision-deriver-config-container p')
  expect(decisionDeriverConfig).toBeInTheDocument()
  expect(decisionDeriverConfig.innerHTML).toBe('Unable to retrieve Decision Deriver config. Please check that the service is functioning correctly.')

  const copyButton = document.body.querySelector('button#copy-json')
  expect(copyButton).not.toBeInTheDocument()
})

test('should copy text to clipboard', async () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(() => Promise.resolve())
    }
  });

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: decisionDeriverConfigPayload })

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_ENVIRONMENT_CONFIG)
  initCopy('#decision-deriver-config-json','#copy-json', 'Decision Deriver Config JSON copied', 'Copy JSON')

  const decisionDeriverConfig = document.body.querySelector('code#decision-deriver-config-json')
  expect(decisionDeriverConfig).toBeInTheDocument()

  const copyButton = document.body.querySelector('button#copy-json')
  copyButton.click()
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(prettyPrint(decisionDeriverConfigPayload))
})

test('copy text failure should not throw exception', async () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn(() => Promise.reject(new Error('boom')))
    }
  });

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: decisionDeriverConfigPayload })

  await loadPageAsUser(setupAuthedAdminUserSession, paths.ADMIN_ENVIRONMENT_CONFIG)
  initCopy('#decision-deriver-config-json','#copy-json', 'Decision Deriver Config JSON copied', 'Copy JSON')

  const decisionDeriverConfig = document.body.querySelector('code#decision-deriver-config-json')
  expect(decisionDeriverConfig).toBeInTheDocument()

  const copyButton = document.body.querySelector('button#copy-json')
  expect(() => copyButton.click()).not.toThrow()
})
