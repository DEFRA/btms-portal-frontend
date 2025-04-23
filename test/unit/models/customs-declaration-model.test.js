import { createCustomsDeclarationModel } from '../../../src/models/customs-declaration-model.js'

const notMatchedMatchStatus = {
  isMatched: false,
  unmatchedDocRefs: ['GBCHD2024.1234567']
}
const matchedMatchStatus = {
  isMatched: true,
  unmatchedDocRefs: []
}
const testPreNotifications = {
  data: [
    { id: 'CHEDD.GB.2024.1234567' }
  ]
}

const createTestCustomsDeclaration = (items = [], preNotifications, finalisation) => {
  return {
    entryReference: '24GBD46UUIIABCDEF1',
    updatedSource: '2024-12-21T14:00:00Z',
    items,
    notifications: preNotifications,
    finalisation
  }
}

const createTestCommodities = (testDecisionCode = 'X00') => {
  return [
    {
      itemNumber: 1,
      customsProcedureCode: '4000000',
      taricCommodityCode: '1207409000',
      goodsDescription: 'MECHANICALLY HULLED SESAME SEED',
      itemNetMass: '7668.932',
      itemSupplementaryUnits: '0',
      documents: [
        {
          documentCode: 'C678',
          documentReference: 'GBCHD2024.1234567',
          documentStatus: 'AE',
          documentControl: 'P',
          documentQuantity: null
        }
      ],
      checks: [
        {
          checkCode: 'H223',
          departmentCode: 'PHA',
          decisionCode: testDecisionCode,
          decisionsValidUntil: null,
          decisionReasons: null
        }
      ]
    }
  ]
}

describe('#createCustomsDeclarationModel', () => {
  test.each([
    { decisionCode: 'X00', finalisation: null, expectedStatus: 'No match', preNotifications: { data: [] }, expectedDecision: 'No Match (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: 'C03', finalisation: null, expectedStatus: 'Released', preNotifications: testPreNotifications, expectedDecision: 'Release - Inspection Complete (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus, open: true },
    { decisionCode: 'N02', finalisation: null, expectedStatus: 'Refusal', preNotifications: testPreNotifications, expectedDecision: 'Refusal - Destroy (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus, open: true },
    { decisionCode: 'H01', finalisation: null, expectedStatus: 'Hold', preNotifications: testPreNotifications, expectedDecision: 'Hold - Awaiting Decision (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus, open: true },
    { decisionCode: 'E02', finalisation: null, expectedStatus: 'Data error', preNotifications: { data: [] }, expectedDecision: 'Data error - Data Error Full Dec vs CFSP loc (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: null, expectedStatus: 'Unknown', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: '', manualAction: true }, expectedStatus: 'Manually released', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: 'Cleared', manualAction: false }, expectedStatus: 'Released', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: 'CancelledAfterArrival', manualAction: false }, expectedStatus: 'Cancelled', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: false },
    { decisionCode: null, finalisation: { finalState: 'CancelledWhilePreLodged', manualAction: false }, expectedStatus: 'Cancelled', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: false },
    { decisionCode: null, finalisation: { finalState: 'Destroyed', manualAction: false }, expectedStatus: 'Destroyed', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: 'Seized', manualAction: false }, expectedStatus: 'Seized', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: 'ReleasedToKingsWarehouse', manualAction: false }, expectedStatus: 'Released to warehouse', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true },
    { decisionCode: null, finalisation: { finalState: 'TransferredToMss', manualAction: false }, expectedStatus: 'Transferred to MSS', preNotifications: { data: [] }, expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus, open: true }
  ])('should return a model with the correct structure for decision code $decisionCode', ({ decisionCode, finalisation, expectedStatus, preNotifications, expectedDecision, expectedMatchStatus, open }) => {
    const testCustomsDeclaration = createTestCustomsDeclaration(createTestCommodities(decisionCode), preNotifications, finalisation)
    const result = createCustomsDeclarationModel(testCustomsDeclaration)
    expect(result).toEqual({
      movementReferenceNumber: '24GBD46UUIIABCDEF1',
      customsDeclarationStatus: expectedStatus,
      lastUpdated: '21 December 2024, 14:00',
      open,
      commodities: [
        {
          commodityCode: '1207409000',
          commodityDesc: 'MECHANICALLY HULLED SESAME SEED',
          decisions: [expectedDecision],
          documents: ['GBCHD2024.1234567'],
          itemNumber: 1,
          matchStatus: expectedMatchStatus,
          weightOrQuantity: '7668.932'
        }
      ]
    })
  })

  test('dedupes document references', () => {
    const sourceCustomsDeclaration = {
      entryReference: '24GBE2IL9OF0YMQAR2',
      updatedSource: '2025-04-07T08:58:28.725Z',
      items: [
        {
          itemNumber: 1,
          taricCommodityCode: '0806101090',
          goodsDescription: 'EDIBLE FRUIT AND NUTS',
          itemNetMass: '16200',
          documents: [
            {
              documentCode: 'N001',
              documentReference: 'GBCHD2024.5300753'
            },
            {
              documentCode: 'N002',
              documentReference: 'GBCHD2024.5300753'
            }
          ],
          checks: []
        }
      ],
      notifications: {
        data: []
      }
    }
    const result = createCustomsDeclarationModel(sourceCustomsDeclaration)

    expect(result).toEqual({
      movementReferenceNumber: '24GBE2IL9OF0YMQAR2',
      open: true,
      commodities: [{
        commodityCode: '0806101090',
        commodityDesc: 'EDIBLE FRUIT AND NUTS',
        decisions: [],
        documents: ['GBCHD2024.5300753'],
        itemNumber: 1,
        matchStatus: {
          isMatched: false,
          unmatchedDocRefs: ['GBCHD2024.5300753']
        },
        weightOrQuantity: '16200'
      }],
      customsDeclarationStatus: 'Released',
      lastUpdated: '7 April 2025, 08:58'
    })
  })

  test('matches malformed document references', () => {
    const sourceCustomsDeclaration = {
      entryReference: '24GBE2IL9OF0YMQAR3',
      updatedSource: '2025-04-10T17:08:01.725Z',
      items: [
        {
          itemNumber: 1,
          taricCommodityCode: '0806101090',
          goodsDescription: 'EDIBLE FRUIT AND NUTS',
          itemNetMass: '16200',
          documents: [
            {
              documentCode: 'N001',
              documentReference: 'GB.2024.7654321'
            }
          ],
          checks: []
        }
      ],
      notifications: {
        data: [{ id: 'GB.CHED.2024.7654321' }]
      }
    }

    const result = createCustomsDeclarationModel(sourceCustomsDeclaration)

    expect(result).toEqual({
      movementReferenceNumber: '24GBE2IL9OF0YMQAR3',
      open: true,
      commodities: [{
        commodityCode: '0806101090',
        commodityDesc: 'EDIBLE FRUIT AND NUTS',
        decisions: [],
        documents: ['GB.2024.7654321'],
        itemNumber: 1,
        matchStatus: {
          isMatched: true,
          unmatchedDocRefs: []
        },
        weightOrQuantity: '16200'
      }],
      customsDeclarationStatus: 'Released',
      lastUpdated: '10 April 2025, 17:08'
    })
  })

  test('filters out IUU Document references', () => {
    const sourceCustomsDeclaration = {
      entryReference: '25GB14XSTDMHNNIUU1',
      updatedSource: '2025-04-14T17:24:01.725Z',
      items: [
        {
          itemNumber: 1,
          taricCommodityCode: '0304719030',
          goodsDescription: 'FROZEN MSC A COD FILLETS',
          itemNetMass: '17088.98',
          documents: [
            {
              documentCode: 'N001',
              documentReference: 'GB.2025.2233441'
            },
            {
              documentCode: 'C641',
              documentReference: 'GB.2025.2233442'
            },
            {
              documentCode: 'C673',
              documentReference: 'GB.2025.2233443'
            }
          ],
          checks: []
        }
      ],
      notifications: {
        data: [
          { id: 'GB.CHED.2025.2233441' },
          { id: 'GB.IUURU.2025.2233442' },
          { id: 'GB.IUURU.2025.2233443' }
        ]
      }
    }

    const result = createCustomsDeclarationModel(sourceCustomsDeclaration)

    expect(result).toEqual({
      movementReferenceNumber: '25GB14XSTDMHNNIUU1',
      open: true,
      commodities: [{
        commodityCode: '0304719030',
        commodityDesc: 'FROZEN MSC A COD FILLETS',
        decisions: [],
        documents: ['GB.2025.2233441'],
        itemNumber: 1,
        matchStatus: {
          isMatched: true,
          unmatchedDocRefs: []
        },
        weightOrQuantity: '17088.98'
      }],
      customsDeclarationStatus: 'Released',
      lastUpdated: '14 April 2025, 17:24'
    })
  })
})
