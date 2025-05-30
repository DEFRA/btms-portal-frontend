import { mapCustomsDeclarations, getCustomsDeclarationStatus, getDecisionDescription } from '../../../src/models/customs-declarations.js'

test('MRN, open, finalised, using netMass, matched', () => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB251234567890ABCD',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          netMass: '9999',
          documents: [{
            documentCode: 'C678',
            documentReference: 'GBCHD2025.1234567'
          }, {
            documentCode: 'C641',
            documentReference: 'IGNORED IUUD DOCUMENT'
          }],
          checks: [{
            checkCode: 'H223'
          }]
        }],
        finalisation: {
          isManualRelease: false,
          finalState: 0
        }
      },
      clearanceDecision: {
        items: [{
          itemNumber: 1,
          checks: [{
            decisionCode: 'C03',
            checkCode: 'H223'
          }]
        }]
      },
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.1234567'
      }
    }]
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        decisions: [{
          documentReference: 'GBCHD2025.1234567',
          match: true,
          outcomes: [{
            decision: 'Release',
            decisionDetail: 'Inspection complete',
            departmentCode: 'FNAO'
          }]
        }],
        documents: {
          'GBCHD2025.1234567': ['C678']
        },
        checks: [{ checkCode: 'H223' }],
        itemNumber: 1,
        netMass: '9999',
        weightOrQuantity: '9999'
      }
    ],
    movementReferenceNumber: 'GB251234567890ABCD',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Released',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})

test('MRN, open, manual release, using supplementaryUnits, no decisions', () => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB250123456789DCBA',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          supplementaryUnits: '12',
          documents: [{
            documentCode: 'N851',
            documentReference: 'GBCHD2025.1234567'
          }, {
            documentCode: 'C641',
            documentReference: 'IGNORED IUUD DOCUMENT'
          }],
          checks: [{ checkCode: 'H219' }]
        }],
        finalisation: {
          isManualRelease: true
        }
      },
      clearanceDecision: null,
      updated: '2025-05-12T12:42:17.330Z'
    }],
    importPreNotifications: []
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        decisions: [{
          documentReference: 'GBCHD2025.1234567',
          match: false,
          outcomes: [
            {
              decision: '',
              decisionDetail: undefined,
              departmentCode: 'PHSI'
            }]
        }],
        documents: {
          'GBCHD2025.1234567': ['N851']
        },
        checks: [{ checkCode: 'H219' }],
        itemNumber: 1,
        supplementaryUnits: '12',
        weightOrQuantity: '12'
      }
    ],
    movementReferenceNumber: 'GB250123456789DCBA',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Manually released',
    updated: '12 May 2025, 12:42'
  }]

  expect(result).toEqual(expected)
})

test('de-dupes document references', () => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB2501010101010101',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          netMass: '1000',
          documents: [{
            documentCode: 'N853',
            documentReference: 'GBCHD2025.0000001'
          }, {
            documentCode: 'N853',
            documentReference: 'GBCHD2025.0000001'
          }],
          checks: [{ checkCode: 'H222' }]
        }],
        finalisation: null
      },
      clearanceDecision: null,
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: []
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [{
      decisions: [{
        documentReference: 'GBCHD2025.0000001',
        match: false,
        outcomes: [{
          decision: '',
          decisionDetail: undefined,
          departmentCode: 'POAO'
        }]
      }],
      documents: {
        'GBCHD2025.0000001': ['N853']
      },
      checks: [{ checkCode: 'H222' }],
      itemNumber: 1,
      netMass: '1000',
      weightOrQuantity: '1000'
    }],
    movementReferenceNumber: 'GB2501010101010101',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Unknown',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})

test('matches malformed references', () => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB2502020202020202',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          netMass: '500',
          documents: [{
            documentCode: 'C678',
            documentReference: 'GB.CHD.2025.0000002'
          }],
          checks: [{ checkCode: 'H223' }]
        }],
        finalisation: null
      },
      clearanceDecision: null,
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.0000002'
      }
    }]
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [{
      decisions: [{
        documentReference: 'GB.CHD.2025.0000002',
        match: true,
        outcomes: [{
          decision: '',
          decisionDetail: undefined,
          departmentCode: 'FNAO'
        }]
      }],
      checks: [{ checkCode: 'H223' }],
      documents: {
        'GB.CHD.2025.0000002': ['C678']
      },
      itemNumber: 1,
      netMass: '500',
      weightOrQuantity: '500'
    }],
    movementReferenceNumber: 'GB2502020202020202',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Unknown',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})

test('getCustomsDeclarationStatus() no finalisation, prefers error codes', () => {
  const items = [{
    checks: [
      { decisionCode: 'C0_RELEASED_CODE' },
      { decisionCode: 'H0_HOLD_CODE' },
      { decisionCode: 'X00' },
      { decisionCode: 'N0_REFUSAL_CODE' },
      { decisionCode: 'E0_ERROR_CODE' }
    ]
  }]
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('Data error')
})

test('getCustomsDeclarationStatus() no finalisation, prefers refusal codes', () => {
  const items = [{
    checks: [
      { decisionCode: 'C0_RELEASED_CODE' },
      { decisionCode: 'H0_HOLD_CODE' },
      { decisionCode: 'X00' },
      { decisionCode: 'N0_REFUSAL_CODE' }
    ]
  }]
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('Refusal')
})

test('getCustomsDeclarationStatus() no finalisation, prefers no match codes', () => {
  const items = [{
    checks: [
      { decisionCode: 'C0_RELEASED_CODE' },
      { decisionCode: 'H0_HOLD_CODE' },
      { decisionCode: 'X00' }
    ]
  }]
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('No match')
})

test('getCustomsDeclarationStatus() no finalisation, prefers hold codes', () => {
  const items = [{
    checks: [
      { decisionCode: 'C0_RELEASED_CODE' },
      { decisionCode: 'H0_HOLD_CODE' }
    ]
  }]
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('Hold')
})

test('getCustomsDeclarationStatus() no finalisation, release codes are last', () => {
  const items = [{
    checks: [
      { decisionCode: 'C0_RELEASED_CODE' }
    ]
  }]
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('Released')
})

test('getCustomsDeclarationStatus() no finalisation, no clearanceDecision items', () => {
  const items = []
  const finalisation = null

  expect(getCustomsDeclarationStatus(items, finalisation))
    .toBe('Unknown')
})

test('getDecisionDescription()', () => {
  expect(getDecisionDescription('C01'))
    .toBe('Release')

  expect(getDecisionDescription('N01'))
    .toBe('Refuse')

  expect(getDecisionDescription('E01'))
    .toBe('Data error')

  expect(getDecisionDescription('H01'))
    .toBe('Hold')

  expect(getDecisionDescription('X00'))
    .toBe('')
})
