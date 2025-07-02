import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getAllByRole, getByRole } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { initFilters } from '../../src/client/javascripts/filters.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const customsDeclarations = [{
  movementReferenceNumber: '24GB0Z8WEJ9ZBTL73B',
  clearanceRequest: {
    declarationUcr: '1GB126344356000-ABC35932Y1BHX',
    commodities: [{
      itemNumber: 1,
      taricCommodityCode: '0304719030',
      goodsDescription: 'FROZEN MSC A COD FILLETS',
      netMass: '17088.98',
      supplementaryUnits: 0,
      documents: [{
        documentReference: 'CHEDA.GB.2025.0000001',
        documentCode: 'N002'
      }],
      checks: [
        { checkCode: 'H218', departmentCode: 'HMI' }
      ]
    }, {
      itemNumber: 2,
      taricCommodityCode: '0304720000',
      goodsDescription: 'FROZEN MSC HADDOCK FILLETS',
      netMass: '4618.35',
      documents: [{
        documentReference: 'CHEDP.GB.2025.0000002',
        documentCode: 'N853'
      }],
      checks: [{
        departmentCode: 'HMI',
        checkCode: 'H222'
      }]
    }, {
      itemNumber: 3,
      taricCommodityCode: '1602321990',
      goodsDescription: 'JBB VIENNESE ROAST 2 KG',
      netMass: '87.07',
      documents: [{
        documentReference: 'CHEDP.BB.2025.NOMATCH',
        documentCode: 'N002'
      }],
      checks: [{ checkCode: 'H220', departmentCode: 'HMI' }]
    }]
  },
  clearanceDecision: {
    items: [{
      itemNumber: 1,
      checks: [{
        checkCode: 'H218',
        decisionCode: 'C03'
      }]
    }, {
      itemNumber: 2,
      checks: [{
        checkCode: 'H222',
        decisionCode: 'H01'
      }]
    }, {
      itemNumber: 3,
      checks: [{
        checkCode: 'H220',
        decisionCode: 'X00'
      }]
    }]
  },
  finalisation: {
    finalState: 0,
    isManualRelease: false
  },
  updated: '2025-05-06T13:11:59.257Z'
}]

const importPreNotifications = [{
  importPreNotification: {
    referenceNumber: 'CHEDP.GB.2025.0000002',
    importNotificationType: 'CVEDP',
    status: 'VALIDATED',
    updatedSource: '2025-04-22T16:55:17.330Z',
    partOne: {
      commodities: {
        commodityComplements: [{
          complementId: '2',
          commodityId: '0202',
          complementName: 'Dog Chew'
        }],
        complementParameterSets: [{
          uniqueComplementId: 'bbdb5c23-0f7c-4c8f-ac1d-8d81aacdc0d9',
          complementId: '2',
          keyDataPair: [{ key: 'netweight', data: '4618.35' }]
        }]
      }
    }
  }
}, {
  importPreNotification: {
    referenceNumber: 'CHEDA.GB.2025.0000001',
    importNotificationType: 'CVEDA',
    status: 'CANCELLED',
    updatedSource: '2025-04-22T16:53:17.330Z',
    partOne: {
      commodities: {
        commodityComplements: [{
          complementId: '1',
          commodityId: '0101',
          speciesName: 'Equus asinus'
        }],
        complementParameterSets: [{
          uniqueComplementId: '9604ce16-8352-4ead-ae8b-4828b3e022cb',
          complementId: '1',
          keyDataPair: [{ key: 'number_animal', data: '2' }]
        }]
      }
    }
  }
}]

const relatedImportDeclarations = {
  customsDeclarations,
  importPreNotifications
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('shows search results', async () => {
  const user = userEvent.setup()

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73B`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":true}').toString('base64')
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const declaration = getByRole(document.body, 'group', { name: '24GB0Z8WEJ9ZBTL73B' })
  expect(declaration).toHaveAttribute('open')

  const declarationRow3 = getByRole(declaration, 'row', {
    name: '3 1602321990 JBB VIENNESE ROAST 2 KG 87.07 CHEDP.BB.2025.NOMATCH This CHED reference cannot be found on the customs declaration. Please check that the reference is correct. No No match (HMI)'
  })
  const declarationMatchFilter = getByRole(document.body, 'combobox', { name: 'Match' })
  await user.selectOptions(declarationMatchFilter, 'true')
  expect(declarationRow3.hasAttribute('hidden')).toBe(true)

  await user.selectOptions(declarationMatchFilter, '')

  const declarationRow2 = getByRole(declaration, 'row', {
    name: '2 0304720000 FROZEN MSC HADDOCK FILLE... FROZEN MSC HADDOCK FILLETS 4618.35 CHEDP.GB.2025.0000002 Yes Hold - Awaiting decision (POAO)'
  })
  const declarationDecisionFilter = getByRole(document.body, 'combobox', { name: 'Decision' })
  await user.selectOptions(declarationDecisionFilter, 'Release')
  expect(declarationRow2.hasAttribute('hidden')).toBe(true)

  const declarationRow1 = getByRole(declaration, 'row', {
    name: '1 0304719030 FROZEN MSC A COD FILLETS 17088.98 CHEDA.GB.2025.0000001 Yes Release - CHED cancelled (HMI)'
  })
  const [declarationAuthorityFilter] = getAllByRole(document.body, 'combobox', { name: 'Authority' })
  await user.selectOptions(declarationAuthorityFilter, 'APHA')
  expect(declarationRow1.hasAttribute('hidden')).toBe(true)

  const [resetDeclaration] = await getAllByRole(document.body, 'button')
  await user.click(resetDeclaration)
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)
  expect(declarationRow2.hasAttribute('hidden')).toBe(false)
  expect(declarationRow3.hasAttribute('hidden')).toBe(false)

  const notification1 = getByRole(document.body, 'group', { name: 'CHEDP.GB.2025.0000002' })
  expect(notification1.hasAttribute('open')).toBe(true)
  const notificationRow1 = getByRole(notification1, 'row', {
    name: '2 0202 Dog Chew 4618.35 Decision not given (POAO)'
  })

  const notificationAuthorityFilter = getAllByRole(document.body, 'combobox', { name: 'Authority' })[1]
  await user.selectOptions(notificationAuthorityFilter, 'HMI')
  expect(notificationRow1.hasAttribute('hidden')).toBe(true)

  const resetNotification = getByRole(document.body, 'button')
  await user.click(resetNotification)
  expect(notificationRow1.hasAttribute('hidden')).toBe(false)

  const closedNotification = getByRole(document.body, 'group', { name: 'CHEDA.GB.2025.0000001' })
  expect(closedNotification.hasAttribute('open')).toBe(false)
  expect(getByRole(closedNotification, 'row', {
    name: '1 0101 Equus asinus 2 Decision not given (APHA)'
  })).not.toBeVisible()

  expect(document.querySelectorAll('script[nonce]').length)
    .toBe(2)
})

test('redirects to search page if no results', async () => {
  const noResults = {
    customsDeclarations: [],
    importPreNotifications: []
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: noResults })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73Y`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('redirects to search page for missing search', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('redirects to search page for incorrect search', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=NOT_SEARCHABLE`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test('rejects non authorised requests', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73Y`
  })

  expect(statusCode).toBe(401)
})

test('handles upstream errors', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockRejectedValueOnce(new Error('boom'))

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73Y`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  globalJsdom(payload)

  expect(statusCode).toBe(500)

  expect(getByRole(document.body, 'heading', { name: 'Sorry, there is a problem with this service' }))
    .toBeInTheDocument()
})
