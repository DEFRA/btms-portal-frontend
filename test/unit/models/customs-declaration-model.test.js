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

const createTestCustomsDeclaration = (items = null, preNotifications) => {
  return {
    entryReference: '24GBD46UUIIABCDEF1',
    updatedSource: '2024-12-21T14:00:00Z',
    items,
    notifications: preNotifications
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
    { decisionCode: 'X00', expectedStatus: 'No match', preNotifications: [], expectedDecision: 'No Match (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus },
    { decisionCode: 'C03', expectedStatus: 'Released', preNotifications: testPreNotifications, expectedDecision: 'Release - Inspection Complete (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus },
    { decisionCode: 'N02', expectedStatus: 'Refusal', preNotifications: testPreNotifications, expectedDecision: 'Refusal - Destroy (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus },
    { decisionCode: 'H01', expectedStatus: 'Hold', preNotifications: testPreNotifications, expectedDecision: 'Hold - Awaiting Decision (PHA - FNAO)', expectedMatchStatus: matchedMatchStatus },
    { decisionCode: 'E02', expectedStatus: 'Data error', preNotifications: [], expectedDecision: 'Data error - Data Error Full Dec vs CFSP loc (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus },
    { decisionCode: null, expectedStatus: 'Unknown', preNotifications: [], expectedDecision: 'Unknown (PHA - FNAO)', expectedMatchStatus: notMatchedMatchStatus }
  ])('should return a model with the correct structure for decision code $decisionCode', ({ decisionCode, expectedStatus, preNotifications, expectedDecision, expectedMatchStatus }) => {
    const testCustomsDeclaration = createTestCustomsDeclaration(createTestCommodities(decisionCode), preNotifications)
    const result = createCustomsDeclarationModel(testCustomsDeclaration)
    expect(result).toEqual({
      movementReferenceNumber: '24GBD46UUIIABCDEF1',
      customsDeclarationStatus: expectedStatus,
      lastUpdated: '21 December 2024, 14:00',
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
})
