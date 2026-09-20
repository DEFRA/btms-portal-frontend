import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'
import userEvent from '@testing-library/user-event'
import { paths, queryStringParams } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'
import { initialiseServer } from '../utils/initialise-server.js'
import { setupAuthedUserSession } from '../unit/utils/session-helper.js'
import { initFilters } from '../../src/client/javascripts/filters.js'
import { RESOURCE_TYPE } from '../../src/models/resource-events.js'

afterEach(() => {
  config.set('isTracesChedsEnabled', false)
})

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
          documentReference: 'CHEDP.GB.2025.0000002',
          mode: null
        },
        {
          itemNumber: 3,
          checkCode: 'H220',
          decisionCode: 'X00',
          documentReference: 'CHEDP.BB.2025.NOMATCH',
          decisionReason:
            'This CHED reference cannot be found on the customs declaration. Please check that the reference is correct.',
          internalDecisionCode: 'E70',
          mode: 'Active'
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


const emptyResourceEvents = []

const invalidResourceEvents = [
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceRequest',
    message: 'invalid json'
  }
]


// Note - not full resource event samples, just enough to mock the usage in the implementation
const declarationResourceEvents = [
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceRequest',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": "2025-01-02T09:00:00Z",\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105",\n'
      + '            "documents": [\n'
      + '              {\n'
      + '                "documentCode": "C640",\n'
      + '                "documentReference": "CHEDA.GB.2025.0000001"\n'
      + '              }\n'
      + '            ],\n'
      + '            "checks": [{\n'
      + '              "checkCode": "H221"\n'
      + '            }]\n'
      + '          }\n'
      + '        ]\n'
      + '      }\n'
      + '    }\n'
      + '  }',
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "externalVersionNumber": 1,\n'
      + '        "decisionNumber": 1,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "documentCode": "N002",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E70"\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": "2025-01-05T09:00:00Z"\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "externalVersionNumber": 2,\n'
      + '        "decisionNumber": 2,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "documentCode": "N002",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E70",\n'
      + '            "mode": null\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": "2025-01-01T09:00:00Z"\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "externalVersionNumber": 3,\n'
      + '        "decisionNumber": 3,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "documentCode": "N002",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E70",\n'
      + '            "mode": "Active"\n'
      + '          },\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "documentCode": "N002",\n'
      + '            "decisionCode": "H01",\n'
      + '            "internalDecisionCode": "E20",\n'
      + '            "mode": "Passive"\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": "2025-01-01T09:00:00.000Z"\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'Finalisation',
    message: '{\n'
      + '    "resource": {\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true,\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": "2025-01-05T09:00:00.0000001Z"\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ExternalError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "externalErrors": [\n'
      + '        {\n'
      + '          "messageSentAt": "2025-01-04T09:00:00Z",\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "HMRCVAL101",\n'
      + '              "message": "An error notification sent by CDS into BTMS"\n'
      + '            }\n'
      + '          ]\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'ProcessingError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "processingErrors": [\n'
      + '        {\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "ALVSVAL303",\n'
      + '              "message": "An error detected in the Imports Processor"\n'
      + '            }\n'
      + '          ],\n'
      + '          "externalVersion": 1,\n'
      + '          "created": "2025-01-03T09:00:00.000Z"\n'
      + '        },\n'
      + '        {\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "ALVSVAL303",\n'
      + '              "message": "An error detected in the Imports Processor"\n'
      + '            }\n'
      + '          ],\n'
      + '          "externalVersion": 1,\n'
      + '          "created": "2025-01-02T09:00:00Z"\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceRequest',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": null,\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105",\n'
      + '            "documents": [\n'
      + '              {\n'
      + '                "documentCode": "C640",\n'
      + '                "documentReference": "CHEDA.GB.2025.0000001"\n'
      + '              }\n'
      + '            ],\n'
      + '            "checks": [{\n'
      + '              "checkCode": "H221"\n'
      + '            }]\n'
      + '          }\n'
      + '        ]\n'
      + '      }\n'
      + '    }\n'
      + '  }',
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ClearanceDecision',
    message: '{\n'
      + '    "resource": {\n'
      + '      "clearanceRequest": {\n'
      + '        "commodities": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "goodsDescription": "Horse Re-entry",\n'
      + '            "taricCommodityCode": "1601009105"\n'
      + '          }\n'
      + '        ]\n'
      + '      },\n'
      + '      "clearanceDecision": {\n'
      + '        "externalVersionNumber": 1,\n'
      + '        "decisionNumber": 1,\n'
      + '        "items": [\n'
      + '          {\n'
      + '            "itemNumber": 1\n'
      + '          }\n'
      + '        ],\n'
      + '        "results": [\n'
      + '          {\n'
      + '            "itemNumber": 1,\n'
      + '            "documentReference": "CHEDA.GB.2025.0000001",\n'
      + '            "checkCode": "H221",\n'
      + '            "documentCode": "N002",\n'
      + '            "decisionCode": "X00",\n'
      + '            "internalDecisionCode": "E70"\n'
      + '          }\n'
      + '        ],\n'
      + '        "created": null\n'
      + '      },\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'Finalisation',
    message: '{\n'
      + '    "resource": {\n'
      + '      "finalisation": {\n'
      + '        "isManualRelease": true,\n'
      + '        "externalVersion": 1,\n'
      + '        "messageSentAt": null\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'CustomsDeclaration',
    subResourceType: 'ExternalError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "externalErrors": [\n'
      + '        {\n'
      + '          "messageSentAt": null,\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "HMRCVAL101",\n'
      + '              "message": "An error notification sent by CDS into BTMS"\n'
      + '            }\n'
      + '          ]\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'ProcessingError',
    message: '{\n'
      + '    "resource": {\n'
      + '      "processingErrors": [\n'
      + '        {\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "ALVSVAL303",\n'
      + '              "message": "An error detected in the Imports Processor"\n'
      + '            }\n'
      + '          ],\n'
      + '          "externalVersion": 1,\n'
      + '          "created": null\n'
      + '        },\n'
      + '        {\n'
      + '          "errors": [\n'
      + '            {\n'
      + '              "code": "ALVSVAL303",\n'
      + '              "message": "An error detected in the Imports Processor"\n'
      + '            }\n'
      + '          ],\n'
      + '          "externalVersion": 1,\n'
      + '          "created": null\n'
      + '        }\n'
      + '      ]\n'
      + '    }\n'
      + '  }'
  }
]


const importPreNotificationResourceEvents = [
  {
    resourceType: 'ImportPreNotification',
    message: '{\n'
      + '    "resource": {\n'
      + '      "importPreNotification": {\n'
      + '        "referenceNumber": "CHEDA.GB.2025.0000001",\n'
      + '        "status": "VALIDATED",\n'
      + '        "decisionDate": "2025-01-01T09:00:00.000Z",\n'
      + '        "updatedSource": "2025-01-01T09:00:00Z",\n'
      + '        "partTwo": {\n'
      + '          "decision": {\n'
      + '            "decision": "Horse Re-entry"\n'
      + '          }\n'
      + '        }\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  },
  {
    resourceType: 'ImportPreNotification',
    message: '{\n'
      + '    "resource": {\n'
      + '      "importPreNotification": {\n'
      + '        "referenceNumber": "CHEDA.GB.2025.0000001",\n'
      + '        "status": "VALIDATED",\n'
      + '        "decisionDate": "2025-01-01T09:00:00.000Z",\n'
      + '        "updatedSource": null,\n'
      + '        "partTwo": {\n'
      + '          "decision": {\n'
      + '            "decision": "Horse Re-entry"\n'
      + '          }\n'
      + '        }\n'
      + '      }\n'
      + '    }\n'
      + '  }'
  }
]


jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

const COOKIE_POLICY_HEADER = {
  cookie: 'cookiePolicy=' + Buffer.from('{"analytics": "no"}').toString('base64')
}

const searchResultUrl = (searchTerm) => `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${searchTerm}`

const injectSearchResult = async (url) => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  return server.inject({
    method: 'get',
    url,
    auth: { strategy: 'session', credentials }
  })
}

const injectSearchResultWithCookie = async (url) => {
  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  return server.inject({
    method: 'get',
    url,
    auth: { strategy: 'session', credentials },
    headers: COOKIE_POLICY_HEADER
  })
}


const createTracesChed = (identifier, updated) => ({
  ched: {
    exchangedDocument: {
      identifier,
      documentStatusCode: '1',
      secondSignatoryAuthentication: {
        typeCode: '1',
        includedClause: [
          { identifier: 'DECISION_CONCLUSION', content: 'ACCEPTABLE_FOR_FREE_CIRCULATION' }
        ]
      }
    },
    lastUpdated: updated,
    specifiedConsignment: {
      includedConsignmentItem: [
        {
          includedTradeLineItem: [
            {
              sequenceNumeric: 0,
              applicableClassification: null,
              scientificName: null,
              netWeight: { content: '3600', unitCode: 'KGM' },
              grossWeight: { content: '3700', unitCode: 'KGM' }
            },
            {
              sequenceNumeric: 1,
              applicableClassification: [
                { systemId: 'CN', classCode: { value: '03019985' } }
              ],
              scientificName: 'Salmo salar',
              netWeight: { content: '1000', unitCode: 'KGM' },
              grossWeight: null
            }
          ]
        }
      ]
    }
  },
  created: '2025-01-01T09:00:00.000Z',
  updated
})

const tracesChedTimelineEvents = (reference, { documentStatusCode = '55', lastUpdated } = {}) => [
  {
    resourceType: RESOURCE_TYPE.TRACES_CHED,
    message: JSON.stringify({
      resource: {
        id: reference,
        ched: {
          exchangedDocument: {
            identifier: reference,
            documentStatusCode
          },
          lastUpdated
        }
      }
    })
  }
]

const TRACES_CHED_REFERENCE = 'CHEDP.GB.2025.0000002'

const showTimelineForMrnWithTracesChed = async (resourceEventsForChed, reference = TRACES_CHED_REFERENCE) => {
  const ched = createTracesChed(reference, '2025-07-02T10:00:00.000Z')

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({
      payload: {
        customsDeclarations: [
          createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
        ],
        importPreNotifications: [],
        cheds: [ched]
      }
    })
    .mockResolvedValueOnce({ payload: resourceEventsForChed })
    .mockResolvedValueOnce({ payload: emptyResourceEvents })

  const { payload } = await injectSearchResult(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  globalJsdom(payload)

  return [...document.body.querySelectorAll('.moj-timeline__item')]
    .find(item => item.querySelector('.moj-timeline__title span:nth-child(1)')?.innerHTML === reference)
}

test('shows latest search results and timeline tabs', async () => {
  const customsDeclarations = [
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z'),
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHY', '2025-05-06T13:11:59.257Z')
  ]

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })
    .mockResolvedValueOnce({ payload: importPreNotificationResourceEvents })
    .mockResolvedValueOnce({ payload: declarationResourceEvents })
    .mockResolvedValueOnce({ payload: emptyResourceEvents })

  const { payload, headers } = await injectSearchResultWithCookie(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const summarySections = document.body.querySelectorAll('.govuk-tabs__panel .govuk-details.btms-details')
  expect(summarySections.length).toBeGreaterThan(0)

  const mrnTimelines = document.body.querySelectorAll('.govuk-tabs__panel .mrn-timeline')
  expect(mrnTimelines.length).toBe(2)
  expect(mrnTimelines[0].hasAttribute('hidden')).toBeFalsy()
  expect(mrnTimelines[1].hasAttribute('hidden')).toBeTruthy()

  const timelineMrnFilter = document.getElementById('timelineMrn')
  expect(timelineMrnFilter).toBeInTheDocument()
  expect(timelineMrnFilter.options.length).toBe(2)
  expect(timelineMrnFilter.options[0].text).toBe('24GB0Z8WEJ9ZBTL73B')
  expect(timelineMrnFilter.options[1].text).toBe('24GB0Z8WEJ9ZBTL73A')

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles.length).toBe(16)
  expect(eventTitles[0]).toBe('CDS finalisation')
  expect(eventTitles[1]).toBe('BTMS decision')
  expect(eventTitles[2]).toBe('CDS processing error')
  expect(eventTitles[3]).toBe('BTMS processing error')
  expect(eventTitles[4]).toBe('CDS clearance request')
  expect(eventTitles[5]).toBe('BTMS decision')
  expect(eventTitles[6]).toBe('BTMS decision')
  expect(eventTitles[7]).toBe('CHEDA.GB.2025.0000001')
  expect(eventTitles[8]).toBe('CDS clearance request')
  expect(eventTitles[9]).toBe('BTMS decision')
  expect(eventTitles[10]).toBe('CDS finalisation')
  expect(eventTitles[11]).toBe('CDS processing error')
  expect(eventTitles[12]).toBe('BTMS processing error')
  expect(eventTitles[13]).toBe('CHEDA.GB.2025.0000001')
  expect(eventTitles[14]).toBe('CHEDA.GB.2025.0000001')
  expect(eventTitles[15]).toBe('CHEDA.GB.2025.0000001')

  const createdDisplayText = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__description .timeline-detail-row time')).map(time => time.innerHTML)
  expect(createdDisplayText[0]).toBe("05 January 2025, 09:00:00")
  expect(createdDisplayText[1]).toBe("05 January 2025, 09:00:00")
  expect(createdDisplayText[2]).toBe("04 January 2025, 09:00:00")
  expect(createdDisplayText[3]).toBe("03 January 2025, 09:00:00")
  expect(createdDisplayText[4]).toBe("02 January 2025, 09:00:00")
  expect(createdDisplayText[5]).toBe("01 January 2025, 09:00:00")
  expect(createdDisplayText[6]).toBe("01 January 2025, 09:00:00")
  expect(createdDisplayText[7]).toBe("01 January 2025, 09:00:00")
  expect(createdDisplayText[8]).toBe("")
  expect(createdDisplayText[9]).toBe("")
  expect(createdDisplayText[10]).toBe("")
  expect(createdDisplayText[11]).toBe("")
  expect(createdDisplayText[12]).toBe("")
  expect(createdDisplayText[13]).toBe("")
  expect(createdDisplayText[14]).toBe("01 January 2025, 09:00:00")
  expect(createdDisplayText[15]).toBe("")

  const timelineClearanceRequestItems = Array.from(document.body.querySelectorAll('.moj-timeline__item'))
    .filter(elem => elem.querySelector('.moj-timeline__header .moj-timeline__title span').innerHTML === 'CDS clearance request')

  const timelineClearanceRequestVersionLabels = timelineClearanceRequestItems
    .map(clearanceRequestItem => clearanceRequestItem.querySelectorAll('.moj-timeline__description .timeline-detail-row span')[0].innerHTML)
  expect(timelineClearanceRequestVersionLabels).toHaveLength(2)
  expect(timelineClearanceRequestVersionLabels.every(label => label === 'External version')).toBeTruthy()

  const timelineClearanceRequestVersions = timelineClearanceRequestItems
    .map(clearanceRequestItem => clearanceRequestItem.querySelectorAll('.moj-timeline__description .timeline-detail-row span')[1].innerHTML)
  expect(timelineClearanceRequestVersions).toHaveLength(2)
  expect(timelineClearanceRequestVersions.every(label => label === '1')).toBeTruthy()

  const timelineBtmsDecisionItems = Array.from(document.body.querySelectorAll('.moj-timeline__item'))
    .filter(elem => elem.querySelector('.moj-timeline__header .moj-timeline__title span').innerHTML === 'BTMS decision')

  const timelineBtmsDecisionCodes = timelineBtmsDecisionItems
    .map(btmsDecisionItem => btmsDecisionItem.querySelectorAll('.govuk-details__text .govuk-table .govuk-table__body .govuk-table__row .govuk-table__cell')[4].innerHTML)
  expect(timelineBtmsDecisionCodes).toHaveLength(4)
  expect(timelineBtmsDecisionCodes.every(decisionCode => decisionCode === 'X00')).toBeTruthy()

  const timelineBtmsDecisionLabels = timelineBtmsDecisionItems
    .map(btmsDecisionItem => btmsDecisionItem.querySelectorAll('.moj-timeline__description div:nth-child(2) span')[0].innerHTML)
  expect(timelineBtmsDecisionLabels).toHaveLength(4)
  expect(timelineBtmsDecisionLabels.every(label => label === 'Decision number')).toBeTruthy()

  const timelineBtmsDecisionNumbers = timelineBtmsDecisionItems
    .map(btmsDecisionItem => btmsDecisionItem.querySelectorAll('.moj-timeline__description div:nth-child(2) span')[1].innerHTML)
  expect(timelineBtmsDecisionNumbers).toHaveLength(4)
  expect(timelineBtmsDecisionNumbers[0]).toBe('1')
  expect(timelineBtmsDecisionNumbers[1]).toBe('2')
  expect(timelineBtmsDecisionNumbers[2]).toBe('3')
  expect(timelineBtmsDecisionNumbers[3]).toBe('1')

  const timelineBtmsDecisionExternalVersions = timelineBtmsDecisionItems
    .map(btmsDecisionItem => btmsDecisionItem.querySelectorAll('.moj-timeline__description div:nth-child(3) span')[0].innerHTML)
  expect(timelineBtmsDecisionExternalVersions).toHaveLength(4)
  expect(timelineBtmsDecisionExternalVersions.every(label => label === 'External version')).toBeTruthy()

  const timelineBtmsDecisionExternalVersionNumbers = timelineBtmsDecisionItems
    .map(btmsDecisionItem => btmsDecisionItem.querySelectorAll('.moj-timeline__description div:nth-child(3) span')[1].innerHTML)
  expect(timelineBtmsDecisionExternalVersionNumbers).toHaveLength(4)
  expect(timelineBtmsDecisionExternalVersionNumbers[0]).toBe('1')
  expect(timelineBtmsDecisionExternalVersionNumbers[1]).toBe('2')
  expect(timelineBtmsDecisionExternalVersionNumbers[2]).toBe('3')
  expect(timelineBtmsDecisionExternalVersionNumbers[3]).toBe('1')
})

test('handles resource event that cannot be parsed and mapped', async () => {
  const customsDeclarations = [
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
  ]

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })
    .mockResolvedValueOnce({ payload: declarationResourceEvents })
    .mockResolvedValueOnce({ payload: invalidResourceEvents })

  const { payload, headers } = await injectSearchResultWithCookie(searchResultUrl('24GB0Z8WEJ9ZBTL73A'))

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles.length).toBe(12)
  expect(eventTitles[0]).toBe('CDS finalisation')
  expect(eventTitles[1]).toBe('BTMS decision')
  expect(eventTitles[2]).toBe('CDS processing error')
  expect(eventTitles[3]).toBe('BTMS processing error')
  expect(eventTitles[4]).toBe('CDS clearance request')
  expect(eventTitles[5]).toBe('BTMS decision')
  expect(eventTitles[6]).toBe('BTMS decision')
  expect(eventTitles[7]).toBe('CDS clearance request')
  expect(eventTitles[8]).toBe('BTMS decision')
  expect(eventTitles[9]).toBe('CDS finalisation')
  expect(eventTitles[10]).toBe('CDS processing error')
  expect(eventTitles[11]).toBe('BTMS processing error')
})

test('handles upstream errors when retrieving resource events', async () => {
  const customsDeclarations = [
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
  ]

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })
    .mockResolvedValueOnce({ payload: declarationResourceEvents })

  const { payload, headers } = await injectSearchResultWithCookie(searchResultUrl('24GB0Z8WEJ9ZBTL73A'))

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles.length).toBe(0)
})

test('timeline can be filtered', async () => {
  const user = userEvent.setup()

  const customsDeclarations = [
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z'),
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHY', '2025-05-06T13:11:59.257Z')
  ]

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })
    .mockResolvedValueOnce({ payload: importPreNotificationResourceEvents })
    .mockResolvedValueOnce({ payload: declarationResourceEvents })
    .mockResolvedValueOnce({ payload: emptyResourceEvents })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const query = {
    [queryStringParams.SEARCH_TERM]: '24GB0Z8WEJ9ZBTL73B',
    timelineMrn: '24GB0Z8WEJ9ZBTL73B'
  }
  const queryString = new URLSearchParams(query).toString()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryString}#timeline-view`,
    auth: { strategy: 'session', credentials },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics":false}').toString('base64')
    }
  })

  globalJsdom(payload)

  window.history.pushState({}, 'test', `?${queryString}`)
  initFilters()

  const timelineMrnFilter = document.getElementById('timelineMrn')

  const mrnTimelines = document.body.querySelectorAll('.govuk-tabs__panel .mrn-timeline')
  expect(mrnTimelines.length).toBe(2)
  expect(mrnTimelines[0].hasAttribute('hidden')).toBeFalsy()
  expect(mrnTimelines[1].hasAttribute('hidden')).toBeTruthy()

  await user.selectOptions(timelineMrnFilter, '24GB0Z8WEJ9ZBTL73A')
  expect(mrnTimelines[0].hasAttribute('hidden')).toBeTruthy()
  expect(mrnTimelines[1].hasAttribute('hidden')).toBeFalsy()

  await user.selectOptions(timelineMrnFilter, '24GB0Z8WEJ9ZBTL73B')
  expect(mrnTimelines[0].hasAttribute('hidden')).toBeFalsy()
  expect(mrnTimelines[1].hasAttribute('hidden')).toBeTruthy()
})

test('shows timeline for unmatched CHED', async () => {
  const customsDeclarations = []

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })
    .mockResolvedValueOnce({ payload: importPreNotificationResourceEvents })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  const query = {
    [queryStringParams.SEARCH_TERM]: '24GB0Z8WEJ9ZBTL73B',
    timelineMrn: '24GB0Z8WEJ9ZBTL73B'
  }
  const queryString = new URLSearchParams(query).toString()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryString}#timeline-view`,
    auth: { strategy: 'session', credentials },
    headers: {
      cookie:
        'cookiePolicy=' + Buffer.from('{"analytics":false}').toString('base64')
    }
  })

  globalJsdom(payload)

  window.history.pushState({}, 'test', `?${queryString}`)
  initFilters()

  const mrnTimelines = document.body.querySelectorAll('.govuk-tabs__panel .mrn-timeline')
  expect(mrnTimelines.length).toBe(1)
  expect(mrnTimelines[0].hasAttribute('hidden')).toBeFalsy()
})

test('handles upstream errors when retrieving resource events for unmatched CHED', async () => {
  const customsDeclarations = []

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  const relatedImportDeclarations = {
    customsDeclarations,
    importPreNotifications
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: relatedImportDeclarations })

  const { payload, headers } = await injectSearchResultWithCookie(searchResultUrl('24GB0Z8WEJ9ZBTL73A'))

  expect(headers['cache-control']).toBe('no-store')

  globalJsdom(payload)
  initFilters()

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles.length).toBe(0)
})

test('fetches the TRACES CHED resource events once for a search with multiple declarations and pre notifications', async () => {
  config.set('isTracesChedsEnabled', true)

  const ched = createTracesChed('CHEDD.GB.2025.0000003', '2025-06-01T09:30:00.000Z')

  wreck.get.mockImplementation((url) => {
    if (url.includes('well-known') || url.includes('auth.endpoint') || url.includes('token.endpoint')) {
      return Promise.resolve({ payload: provider })
    }
    if (url.includes('related-import-declarations')) {
      return Promise.resolve({
        payload: {
          customsDeclarations: [
            createCustomsDeclaration('24GB0Z8WEJ9ZBTL73A', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z'),
            createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHY', '2025-05-06T13:11:59.257Z')
          ],
          importPreNotifications: [
            createImportPreNotification('CHEDP.GB.2025.0000002', 'CVEDP', 'VALIDATED', '2025-04-22T16:55:17.330Z', '2', '0202', 'Dog Chew', '4618.35'),
            createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
          ],
          cheds: [ched]
        }
      })
    }
    return Promise.resolve({ payload: emptyResourceEvents })
  })

  const server = await initialiseServer()
  const credentials = await setupAuthedUserSession(server)

  await server.inject({
    method: 'get',
    url: `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=24GB0Z8WEJ9ZBTL73B`,
    auth: {
      strategy: 'session',
      credentials
    }
  })

  const chedResourceEventCalls = wreck.get.mock.calls.filter(([url]) => url.includes('resource-events/CHEDD.GB.2025.0000003'))
  expect(chedResourceEventCalls.length).toBe(1)
})

test('shows a timeline for a CHED only search when the feature flag is enabled', async () => {
  config.set('isTracesChedsEnabled', true)

  const onlyTracesCheds = {
    customsDeclarations: [],
    importPreNotifications: [],
    cheds: [
      createTracesChed('CHEDP.GB.2025.0000002', '2025-07-02T10:00:00.000Z')
    ]
  }

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: onlyTracesCheds })
    .mockResolvedValueOnce({ payload: tracesChedTimelineEvents('CHEDP.GB.2025.0000002', { lastUpdated: '2025-07-02T10:00:00.000Z' }) })

  const { payload } = await injectSearchResult(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  globalJsdom(payload)

  const timelines = document.body.querySelectorAll('.govuk-tabs__panel .mrn-timeline')
  expect(timelines.length).toBe(1)
  expect(timelines[0].dataset.timeline_ref).toBe('CHEDP.GB.2025.0000002')

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles).toEqual(['CHEDP.GB.2025.0000002'])

  const sources = Array.from(document.body.querySelectorAll('.btms-timeline-event-source')).map(source => source.innerHTML)
  expect(sources).toEqual(['TRACES to BTMS'])
})

test('does not show a CHED timeline group when the feature flag is disabled', async () => {
  config.set('isTracesChedsEnabled', false)

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({
      payload: {
        customsDeclarations: [
          createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
        ],
        importPreNotifications: [],
        cheds: [
          createTracesChed('CHEDP.GB.2025.0000002', '2025-07-02T10:00:00.000Z')
        ]
      }
    })
    .mockResolvedValueOnce({ payload: emptyResourceEvents })

  const { payload } = await injectSearchResult(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  globalJsdom(payload)

  const sources = Array.from(document.body.querySelectorAll('.btms-timeline-event-source')).map(source => source.innerHTML)
  expect(sources).not.toContain('TRACES to BTMS')

  // Double check it honoured the feature flag by ensuring it didn't call for the resource events
  const chedResourceEventCalls = wreck.get.mock.calls.filter(([url]) => url.includes('resource-events/CHEDP.GB.2025.0000002'))
  expect(chedResourceEventCalls.length).toBe(0)
})

test('shows the TRACES CHED on the timeline for an MRN search', async () => {
  config.set('isTracesChedsEnabled', true)

  const chedItem = await showTimelineForMrnWithTracesChed(
    tracesChedTimelineEvents('CHEDP.GB.2025.0000002', { lastUpdated: '2025-07-02T10:00:00.000Z' })
  )

  expect(chedItem).toBeDefined()
  expect(chedItem.querySelector('.moj-timeline__title span:nth-child(1)').innerHTML).toBe('CHEDP.GB.2025.0000002')
  expect(chedItem.querySelector('.btms-timeline-event-source').innerHTML).toBe('TRACES to BTMS')
})

test('shows the TRACES CHED status in words on the timeline', async () => {
  config.set('isTracesChedsEnabled', true)

  const chedItem = await showTimelineForMrnWithTracesChed(
    tracesChedTimelineEvents('CHEDP.GB.2025.0000002', { documentStatusCode: '55', lastUpdated: '2025-07-02T10:00:00.000Z' })
  )

  const statusLabel = [...chedItem.querySelectorAll('.timeline-detail-label')].find(label => label.innerHTML === 'CHED status')
  expect(statusLabel.nextElementSibling.innerHTML).toBe('Deleted')
})

test('shows the TRACES CHED last update date and time on the timeline', async () => {
  config.set('isTracesChedsEnabled', true)

  const chedItem = await showTimelineForMrnWithTracesChed(
    tracesChedTimelineEvents('CHEDP.GB.2025.0000002', { lastUpdated: '2025-07-02T10:00:00.000Z' })
  )

  const createdLabel = [...chedItem.querySelectorAll('.timeline-detail-label')].find(label => label.innerHTML === 'Created')
  expect(createdLabel.nextElementSibling.innerHTML).toBe('02 July 2025, 10:00:00')
})

test('degrades gracefully when retrieving resource events for a TRACES CHED fails', async () => {
  config.set('isTracesChedsEnabled', true)

  const ched = createTracesChed('CHEDP.GB.2025.0000002', '2025-07-02T10:00:00.000Z')

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({
      payload: {
        customsDeclarations: [
          createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
        ],
        importPreNotifications: [],
        cheds: [ched]
      }
    })
    .mockRejectedValueOnce(new Error('TRACES resource events unavailable'))
    .mockResolvedValueOnce({ payload: declarationResourceEvents })

  const { payload, statusCode } = await injectSearchResult(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  expect(statusCode).toBe(200)

  globalJsdom(payload)

  const sources = Array.from(document.body.querySelectorAll('.btms-timeline-event-source')).map(source => source.innerHTML)
  expect(sources).not.toContain('TRACES to BTMS')
})

test('degrades gracefully when retrieving resource events for a pre notification fails', async () => {
  const customsDeclarations = [
    createCustomsDeclaration('24GB0Z8WEJ9ZBTL73B', '1GB126344356000-ABC35932Y1BHX', '2025-05-06T13:11:59.257Z')
  ]

  const importPreNotifications = [
    createImportPreNotification('CHEDA.GB.2025.0000001', 'CVEDA', 'CANCELLED', '2025-04-22T16:55:17.330Z', '1', '0101', 'Equus asinus', '2')
  ]

  wreck.get
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: provider })
    .mockResolvedValueOnce({ payload: { customsDeclarations, importPreNotifications } })
    .mockRejectedValueOnce(new Error('IPAFFS resource events unavailable'))
    .mockResolvedValueOnce({ payload: declarationResourceEvents })

  const { payload, statusCode } = await injectSearchResult(searchResultUrl('24GB0Z8WEJ9ZBTL73B'))

  expect(statusCode).toBe(200)

  globalJsdom(payload)

  const eventTitles = Array.from(document.body.querySelectorAll('.moj-timeline__item .moj-timeline__header .moj-timeline__title span:nth-child(1)')).map(title => title.innerHTML)
  expect(eventTitles).not.toContain('CHEDA.GB.2025.0000001')
})
