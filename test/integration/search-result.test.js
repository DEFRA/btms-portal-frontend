import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import { getAllByRole, getByRole, queryByRole } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { initFilters } from '../../src/client/javascripts/filters.js'

const provider = {
  authorization_endpoint: 'https://auth.endpoint',
  token_endpoint: 'https://token.endpoint'
}

const createCustomsDeclaration = (mrn, ducr, updated) => {
  return {
    movementReferenceNumber: mrn,
    clearanceRequest: {
      declarationUcr: ducr,
      commodities: [
        {
          itemNumber: 1,
          taricCommodityCode: '0304719030',
          goodsDescription: 'FROZEN MSC A COD FILLETS',
          netMass: '17088.98',
          supplementaryUnits: 0,
          documents: [
            {
              documentReference: 'CHEDA.GB.2025.0000001',
              documentCode: 'N002'
            }
          ],
          checks: [{ checkCode: 'H218', departmentCode: 'HMI' }]
        },
        {
          itemNumber: 2,
          taricCommodityCode: '0304720000',
          goodsDescription: 'FROZEN MSC HADDOCK FILLETS',
          netMass: '4618.35',
          documents: [
            {
              documentReference: 'CHEDP.GB.2025.0000002',
              documentCode: 'N853'
            }
          ],
          checks: [
            {
              departmentCode: 'HMI',
              checkCode: 'H222'
            }
          ]
        },
        {
          itemNumber: 3,
          taricCommodityCode: '1602321990',
          goodsDescription: 'JBB VIENNESE ROAST 2 KG',
          netMass: '87.07',
          documents: [
            {
              documentReference: 'CHEDP.BB.2025.NOMATCH',
              documentCode: 'N002'
            }
          ],
          checks: [{ checkCode: 'H220', departmentCode: 'HMI' }]
        }
      ]
    },
    clearanceDecision: {
      results: [
        {
          itemNumber: 1,
          checkCode: 'H218',
          decisionCode: 'C03',
          documentReference: 'CHEDA.GB.2025.0000001'
        },
        {
          itemNumber: 2,
          checkCode: 'H222',
          decisionCode: 'H01',
          documentReference: 'CHEDP.GB.2025.0000002'
        },
        {
          itemNumber: 3,
          checkCode: 'H220',
          decisionCode: 'X00',
          documentReference: 'CHEDP.BB.2025.NOMATCH',
          decisionReason:
            'This CHED reference cannot be found on the customs declaration. Please check that the reference is correct.',
          internalDecisionCode: 'E70'
        }
      ]
    },
    finalisation: {
      finalState: '0',
      isManualRelease: false
    },
    updated
  }
}

const createImportPreNotification = (chedRef, chedType, status, updated, complementId, commodityId, complementName, data) => {
  return {
    importPreNotification: {
      referenceNumber: chedRef,
      importNotificationType: chedType,
      status,
      updatedSource: updated,
      partOne: {
        commodities: {
          commodityComplements: [
            {
              complementId,
              commodityId,
              complementName
            }
          ],
          complementParameterSets: [
            {
              uniqueComplementId: 'bbdb5c23-0f7c-4c8f-ac1d-8d81aacdc0d9',
              complementId,
              keyDataPair: [{ key: 'netweight', data }]
            }
          ]
        }
      }
    }
  }
}

const createGmr = (gmrId, linkedCustomsDeclaration) => {
  return {
    gmr: {
      id: gmrId,
      declarations: {
        customs: [
          { "id": linkedCustomsDeclaration }
        ],
        transits: []
      }
    }
  }
}

const customsDeclarations = [
  createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
]

const importPreNotifications = [
  createImportPreNotification('CHEDP.GB.2025.0000002', 'CVEDP', 'VALIDATED', '2025-04-22T16:55:17.330Z', '2', '0202', 'Dog Chew', '4618.35'),
  createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
]

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
    },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics": "no"}').toString('base64')
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const declaration = getByRole(document.body, 'group', {
    name: '24GB0Z8WEJ9ZBTL73B'
  })
  expect(declaration).toHaveAttribute('open')

  expect(
    getByRole(declaration, 'row', {
      name: '3 1602321990 JBB VIENNESE ROAST 2 KG 87.07 CHEDP.BB.2025.NOMATCH This CHED reference cannot be found on the customs declaration. Please check that the reference is correct. No HMI - GMS No match - CHED cannot be found'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(declaration, 'row', {
      name: '2 0304720000 FROZEN MSC HADDOCK FILLE… FROZEN MSC HADDOCK FILLETS 4618.35 CHEDP.GB.2025.0000002 Yes POAO Hold - Awaiting decision'
    })
  ).toBeInTheDocument()

  expect(
    getByRole(declaration, 'row', {
      name: '1 0304719030 FROZEN MSC A COD FILLETS 17088.98 CHEDA.GB.2025.0000001 Yes HMI - SMS Release - CHED cancelled'
    })
  ).toBeInTheDocument()

  const notification1 = getByRole(document.body, 'group', {
    name: 'CHEDP.GB.2025.0000002'
  })
  expect(notification1.hasAttribute('open')).toBe(true)

  expect(
    getByRole(notification1, 'row', {
      name: '2 0202 Dog Chew 4618.35 POAO Decision not given'
    })
  ).toBeInTheDocument()

  const closedNotification = getByRole(document.body, 'group', {
    name: 'CHEDA.GB.2025.0000001'
  })
  expect(closedNotification.hasAttribute('open')).toBe(false)

  expect(
    getByRole(closedNotification, 'row', {
      name: '1 0101 Equus asinus 2 APHA Decision not given'
    })
  ).not.toBeVisible()

  expect(document.querySelectorAll('script[nonce]').length).toBe(2)
  expect(document.title).toBe(
    'Showing result for 24GB0Z8WEJ9ZBTL73B - Border Trade Matching Service'
  )
})

test('results can be filtered', async () => {
  const user = userEvent.setup()

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const query = {
    [queryStringParams.SEARCH_TERM]: '24GB0Z8WEJ9ZBTL73B',
    authority: 'APHA',
    chedAuthority: 'HMI'
  }
  const queryString = new URLSearchParams(query).toString()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryString}`,
    auth: { strategy: 'session', credentials },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics":false}').toString('base64')
    }
  })

  globalJsdom(payload)

  const declarationRow1 = getByRole(document.body, 'row', {
    name: '1 0304719030 FROZEN MSC A COD FILLETS 17088.98 CHEDA.GB.2025.0000001 Yes HMI - SMS Release - CHED cancelled'
  })
  const notificationRow1 = getByRole(document.body, 'row', {
    name: '2 0202 Dog Chew 4618.35 POAO Decision not given'
  })

  window.history.pushState({}, 'test', `?${queryString}`)
  initFilters()

  const [
    declarationMatchFilter,
    declarationDecisionFilter,
    declarationAuthorityFilter,
    notificationAuthorityFilter
  ] = getAllByRole(document.body, 'combobox')

  const [resetDeclaration, resetNotification] = getAllByRole(
    document.body,
    'button'
  )

  expect(declarationRow1.hasAttribute('hidden')).toBe(true)
  await user.selectOptions(declarationAuthorityFilter, 'HMI')
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)
  await user.selectOptions(declarationAuthorityFilter, 'APHA')
  expect(declarationRow1.hasAttribute('hidden')).toBe(true)

  await user.click(resetDeclaration)
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)

  await user.selectOptions(declarationMatchFilter, 'false')
  expect(declarationRow1.hasAttribute('hidden')).toBe(true)
  await user.selectOptions(declarationMatchFilter, 'true')
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)

  await user.selectOptions(declarationDecisionFilter, 'Hold')
  expect(declarationRow1.hasAttribute('hidden')).toBe(true)
  await user.selectOptions(declarationDecisionFilter, 'Release')
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)
  await user.selectOptions(declarationDecisionFilter, '')
  expect(declarationRow1.hasAttribute('hidden')).toBe(false)

  expect(notificationRow1.hasAttribute('hidden')).toBe(true)
  await user.selectOptions(notificationAuthorityFilter, 'POAO')
  expect(notificationRow1.hasAttribute('hidden')).toBe(false)
  await user.selectOptions(notificationAuthorityFilter, 'HMI')
  expect(notificationRow1.hasAttribute('hidden')).toBe(true)

  await user.click(resetNotification)
  expect(notificationRow1.hasAttribute('hidden')).toBe(false)
})

test('handles H220 1% check', async () => {
  const h220Declaration = {
    customsDeclarations: [
      {
        movementReferenceNumber: '25GBABCDEFGHIJKLMN',
        clearanceRequest: {
          declarationUcr: '2GB432144356000-ABC12345Y1BHX',
          commodities: [
            {
              itemNumber: 1,
              taricCommodityCode: '3120232190',
              goodsDescription: 'CHICKEN 7000 KG',
              netMass: '7000',
              checks: [{ checkCode: 'H220', departmentCode: 'HMI' }],
              documents: null
            }
          ]
        },
        clearanceDecision: {
          items: [],
          results: [
            {
              itemNumber: 1,
              importPreNotification: null,
              documentReference: '',
              documentCode: null,
              checkCode: 'H220',
              decisionCode: 'X00',
              decisionReason: 'Needs a CHED',
              internalDecisionCode: 'E87'
            }
          ]
        },
        finalisation: null,
        updated: '2025-05-06T13:11:59.257Z'
      }
    ],
    importPreNotifications: []
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: h220Declaration })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=25GBABCDEFGHIJKLMN`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: {
      Cookie:
        'cookie_policy=' + Buffer.from('{"analytics":false}').toString('base64')
    }
  })

  globalJsdom(payload)

  const notificationRow = getByRole(document.body, 'row', {
    name: '1 3120232190 CHICKEN 7000 KG 7000 Requires CHED Needs a CHED No HMI - GMS No match - Selected for HMI GMS inspection'
  })

  expect(
    getByRole(notificationRow, 'tooltip', {
      name: 'Needs a CHED'
    })
  ).toBeInTheDocument()
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

test('redirect non authorised requests', async () => {
  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()

  const { statusCode } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73Y`
  })

  expect(statusCode).toBe(302)
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

  expect(
    getByRole(document.body, 'heading', {
      name: 'Sorry, there is a problem with this service'
    })
  ).toBeInTheDocument()
})

test('redirects to search page if GMR search term', async () => {
  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { statusCode, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=GMRA00000AB1`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe(paths.SEARCH)
})

test.each([
  { searchTerm: '24GB0Z8WEJ9ZBTL73A', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73A', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73C', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73B', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: '24GB0Z8WEJ9ZBTL73B', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73B', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73C', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: '24GB0Z8WEJ9ZBTL73C', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73C', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73B', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: '1GB126344356000-ABC35932Y1BHA', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73A', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73C', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73B', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: '1GB126344356000-ABC35932Y1BHB', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73B', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73C', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: '1GB126344356000-ABC35932Y1BHC', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73C', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73B', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: 'CHEDP.GB.2025.0000001', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73C', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73B', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000001', expectedSecondChed: 'CHEDP.GB.2025.0000003', expectedThirdChed: 'CHEDP.GB.2025.0000002' },
  { searchTerm: 'CHEDP.GB.2025.0000002', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73C', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73B', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000002', expectedSecondChed: 'CHEDP.GB.2025.0000003', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
  { searchTerm: 'CHEDP.GB.2025.0000003', expectedFirstMrn: '24GB0Z8WEJ9ZBTL73C', expectedSecondMrn: '24GB0Z8WEJ9ZBTL73B', expectedThirdMrn: '24GB0Z8WEJ9ZBTL73A', expectedFirstChed: 'CHEDP.GB.2025.0000003', expectedSecondChed: 'CHEDP.GB.2025.0000002', expectedThirdChed: 'CHEDP.GB.2025.0000001' },
])('Search results ordered with matching Customs Declaration or Import Pre Notification first, and the remaining Customs Declarations and related Import Pre Notifications ordered descending by updated date', async (options) => {
  const dataApiResults = {
    customsDeclarations: [
      createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHA', '2025-01-01T09:00:00.000Z'),
      createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHB', '2025-02-02T09:00:00.000Z'),
      createCustomsDeclaration('24GB0Z8WEJ9ZBTL73C', '1GB126344356000-ABC35932Y1BHC', '2025-02-02T10:00:00.000Z')
    ],
    importPreNotifications: [
      createImportPreNotification('CHEDP.GB.2025.0000001', 'CVEDP', 'VALIDATED', '2025-01-01T09:00:00.000Z', '1', '0101', 'Dog Chew', '100'),
      createImportPreNotification('CHEDP.GB.2025.0000002', 'CVEDP', 'VALIDATED', '2025-02-02T09:00:00.000Z', '1', '0101', 'Dog Chew', '100'),
      createImportPreNotification('CHEDP.GB.2025.0000003', 'CVEDP', 'VALIDATED', '2025-02-02T10:00:00.000Z', '1', '0101', 'Dog Chew', '100'),
    ]
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: dataApiResults })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${options.searchTerm}`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics": "no"}').toString('base64')
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const summarySections = document.body.querySelectorAll('.govuk-details.btms-details')

  expect(summarySections[0].getAttribute('aria-label')).toBe(options.expectedFirstMrn)
  expect(summarySections[1].getAttribute('aria-label')).toBe(options.expectedSecondMrn)
  expect(summarySections[2].getAttribute('aria-label')).toBe(options.expectedThirdMrn)
  expect(summarySections[3].getAttribute('aria-label')).toBe(options.expectedFirstChed)
  expect(summarySections[4].getAttribute('aria-label')).toBe(options.expectedSecondChed)
  expect(summarySections[5].getAttribute('aria-label')).toBe(options.expectedThirdChed)
})

test.each([
  {
    expectGmrLink: true,
    goodsVehicleMovements: [
      createGmr('GMRA00000AB1', '24GB0Z8WEJ9ZBTL73A')
    ]
  },
  {
    expectGmrLink: false,
    goodsVehicleMovements: []
  }
])('Links to GMR if related', async (options) => {
  const dataApiResults = {
    customsDeclarations: [ createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHA', '2025-01-01T09:00:00.000Z') ],
    importPreNotifications: [],
    goodsVehicleMovements: options.goodsVehicleMovements
  }

  wreck.get
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: provider })
  .mockResolvedValueOnce({ payload: dataApiResults })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const { payload, headers } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73A`,
    auth: {
      strategy: 'session',
      credentials
    },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics": "no"}').toString('base64')
    }
  })

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  if (options.expectGmrLink) {
    expect(getByRole(document.body, 'link', { name: 'GMRA00000AB1' })).toHaveAttribute('href', '/gmr-search-result?searchTerm=GMRA00000AB1')
  } else {
    expect(queryByRole(document.body, 'link', { name: 'GMRA00000AB1' })).not.toBeInTheDocument()
  }
})
