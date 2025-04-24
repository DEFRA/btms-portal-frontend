import globalJsdom from 'global-jsdom'
import { getByRole } from '@testing-library/dom'
import { paths, queryStringParams } from '../../src/routes/route-constants'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const declarations = {
  data: {
    _id: '24GB0Z8WEJ9ZBTL73B',
    entryReference: '24GB0Z8WEJ9ZBTL73B',
    updatedSource: '2025-04-22T16:34:39.149Z',
    items: [{
      itemNumber: 1,
      taricCommodityCode: '0304719030',
      goodsDescription: 'FROZEN MSC A COD FILLETS',
      itemNetMass: '17088.98',
      documents: [{
        documentReference: 'CHEDP.GB.2025.0000001',
        documentCode: 'C640'
      }],
      checks: [{
        decisionCode: 'C03',
        checkCode: 'H221'
      }]
    }, {
      itemNumber: 2,
      taricCommodityCode: '0304720000',
      goodsDescription: 'FROZEN MSC HADDOCK FILLETS',
      itemNetMass: '4618.35',
      documents: [{
        documentReference: 'CHEDP.GB.2025.0000002',
        documentCode: 'N853'
      }],
      checks: [{
        decisionCode: 'H01',
        checkCode: 'H222'
      }]
    }],
    notifications: {
      data: [
        { id: 'CHEDP.GB.2025.0000001' },
        { id: 'CHEDP.GB.2025.0000002' }
      ]
    },
    finalisation: { finalState: 'Cleared', manualAction: false }
  }
}

const notifications = {
  data: [{
    id: 'CHEDP.GB.2025.0000001',
    commodities: [{
      complementId: 1,
      commodityId: '02031955',
      complementName: 'test commodity 1',
      additionalData: {
        netWeight: '2630'
      }
    }],
    updatedSource: '2025-04-22T16:53:17.330Z',
    status: 'Cancelled'
  }, {
    id: 'CHEDP.GB.2025.0000002',
    commodities: [{
      complementId: 2,
      commodityId: '02031955',
      complementName: 'test commodity 2',
      additionalData: {
        netWeight: '1700'
      }
    }],
    updatedSource: '2025-04-22T16:55:17.330Z',
    status: 'Validated'
  }]
}

jest.mock('@hapi/wreck', () => ({
  defaults: jest.fn().mockReturnValue({
    get: jest.fn()
      .mockResolvedValueOnce({ payload: declarations })
      .mockResolvedValueOnce({ payload: notifications })
  }),
  get: jest.fn().mockResolvedValueOnce({ payload: provider })
}))

test('shows search results', async () => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73B`,
    auth: {
      strategy: 'defra-id',
      credentials
    }
  })

  globalJsdom(payload)

  const declaration = getByRole(document.body, 'group', { name: '24GB0Z8WEJ9ZBTL73B' })
  expect(declaration).toHaveAttribute('open')
  getByRole(declaration, 'row', {
    name: '1 0304719030 FROZEN MSC A COD FILLETS 17088.98 CHEDP.GB.2025.0000001 Yes Release - Inspection Complete (APHA)'
  })
  getByRole(declaration, 'row', {
    name: '2 0304720000 FROZEN MSC HADDOCK FILLE... FROZEN MSC HADDOCK FILLETS 4618.35 CHEDP.GB.2025.0000002 Yes Hold - Awaiting Decision (PHA - POAO)'
  })

  const notification1 = getByRole(document.body, 'group', { name: 'CHEDP.GB.2025.0000001' })
  expect(notification1).not.toHaveAttribute('open')
  expect(getByRole(notification1, 'row', {
    name: '1 02031955 test commodity 1 2630 Decision not given (APHA)'
  })).not.toBeVisible()

  const notification2 = getByRole(document.body, 'group', { name: 'CHEDP.GB.2025.0000002' })
  expect(notification2).toHaveAttribute('open')
  expect(getByRole(notification2, 'row', {
    name: '2 02031955 test commodity 2 1700 Decision not given (PHA - POAO)'
  })).toBeVisible()
})
