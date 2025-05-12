import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getByRole } from '@testing-library/dom'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const customsDeclarations = [{
  movementReferenceNumber: '24GB0Z8WEJ9ZBTL73B',
  clearanceRequest: {
    commodities: [{
      itemNumber: 1,
      taricCommodityCode: '0304719030',
      goodsDescription: 'FROZEN MSC A COD FILLETS',
      netMass: '17088.98',
      supplementaryUnits: 0,
      documents: [{
        documentReference: 'CHEDA.GB.2025.0000001',
        documentCode: 'C640'
      }],
      checks: [
        { checkCode: 'H218', departmentCode: 'HMI' },
        { checkCode: 'H223', departmentCode: 'PHA' }
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
    }]
  },
  clearanceDecision: {
    items: [{
      itemNumber: 1,
      checks: [{
        checkCode: 'H221',
        decisionCode: 'C03'
      }]
    }, {
      itemNumber: 2,
      checks: [{
        checkCode: 'H222',
        decisionCode: 'H01'
      }]
    }]
  },
  finalisation: {
    finalState: 0,
    manualAction: false
  },
  updated: '2025-05-06T13:11:59.257Z'
}]

const importPreNotifications = [{
  importPreNotification: {
    referenceNumber: 'CHEDA.GB.2025.0000001',
    status: 'CANCELLED',
    updatedSource: '2025-04-22T16:53:17.330Z',
    commodities: [{
      complementId: '1',
      commodityId: '0101',
      speciesName: 'Equus asinus',
      additionalData: [{ key: 'number_animal', data: '2' }]
    }]
  }
}, {
  importPreNotification: {
    referenceNumber: 'CHEDP.GB.2025.0000002',
    status: 'VALIDATED',
    updatedSource: '2025-04-22T16:55:17.330Z',
    commodities: [{
      complementId: '2',
      commodityId: '0202',
      complementName: 'Dog Chew',
      additionalData: [{ key: 'netweight', data: '4618.35' }]
    }]
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
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)

  const declaration = getByRole(document.body, 'group', { name: '24GB0Z8WEJ9ZBTL73B' })
  expect(declaration).toHaveAttribute('open')
  getByRole(declaration, 'row', {
    name: '1 0304719030 FROZEN MSC A COD FILLETS 17088.98 CHEDA.GB.2025.0000001 Yes Release - Inspection Complete (APHA)'
  })
  getByRole(declaration, 'row', {
    name: '2 0304720000 FROZEN MSC HADDOCK FILLE... FROZEN MSC HADDOCK FILLETS 4618.35 CHEDP.GB.2025.0000002 Yes Hold - Awaiting Decision (PHA - POAO)'
  })

  const notification1 = getByRole(document.body, 'group', { name: 'CHEDA.GB.2025.0000001' })
  expect(notification1.hasAttribute('open')).toBe(false)
  expect(getByRole(notification1, 'row', {
    name: '1 0101 Equus asinus 2 Decision not given (APHA)'
  })).not.toBeVisible()

  const notification2 = getByRole(document.body, 'group', { name: 'CHEDP.GB.2025.0000002' })
  expect(notification2.hasAttribute('open')).toBe(true)
  expect(getByRole(notification2, 'row', {
    name: '2 0202 Dog Chew 4618.35 Decision not given (PHA - POAO)'
  })).toBeVisible()
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

  expect(getByRole(document.body, 'heading', { name: '500' }))
    .toBeInTheDocument()
})
