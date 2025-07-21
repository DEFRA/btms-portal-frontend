import {
  mapCustomsDeclarations,
  getDecision,
  getCustomsDeclarationOpenState
} from '../../../src/models/customs-declarations.js'

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
            documentCode: 'C641',
            documentReference: 'IGNORED IUUD DOCUMENT'
          }, {
            documentCode: 'C678',
            documentReference: 'GBCHD2025.1234567'
          }],
          checks: [{
            checkCode: 'H224'
          }, {
            checkCode: 'H223'
          }]
        }]
      },
      clearanceDecision: {
        items: [{
          itemNumber: 1,
          checks: [{
            decisionCode: 'C07',
            checkCode: 'H224'
          }, {
            decisionCode: 'C03',
            checkCode: 'H223'
          }]
        }]
      },
      finalisation: {
        isManualRelease: false,
        finalState: 0
      },
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.1234567',
        status: 'VALIDATED'
      }
    }]
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        id: expect.any(String),
        decisions: [{
          id: expect.any(String),
          documentReference: 'GBCHD2025.1234567',
          match: true,
          outcome: {
            decision: 'Release',
            decisionDetail: 'Inspection complete',
            decisionReason: null,
            departmentCode: 'FNAO',
            isIuuOutcome: false,
            requiresChed: false
          }
        }, {
          id: expect.any(String),
          documentReference: null,
          match: null,
          outcome: {
            decision: 'Release',
            decisionDetail: 'IUU inspection complete',
            decisionReason: null,
            departmentCode: 'IUU',
            isIuuOutcome: true,
            requiresChed: false
          }
        }],
        documents: {
          'GBCHD2025.1234567': ['C678'],
          'IGNORED IUUD DOCUMENT': ['C641']
        },
        checks: [
          { checkCode: 'H224' },
          { checkCode: 'H223' }
        ],
        itemNumber: 1,
        netMass: '9999',
        weightOrQuantity: '9999'
      }
    ],
    movementReferenceNumber: 'GB251234567890ABCD',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Finalised - Released',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})

test('an MRN, with no CHED, with no documents returns expected response', () => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB251234567890ABCD',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          netMass: '9999',
          checks: [{
            checkCode: 'H220'
          }]
        }]
      },
      clearanceDecision: {
        items: [{
          itemNumber: 1,
          checks: [{
            decisionCode: 'X00',
            checkCode: 'H220'
          }]
        }]
      },
      finalisation: null,
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: []
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        id: expect.any(String),
        decisions: [{
          id: expect.any(String),
          documentReference: null,
          match: false,
          outcome: {
            decision: '',
            decisionDetail: 'No match',
            decisionReason: null,
            departmentCode: 'HMI',
            isIuuOutcome: false,
            requiresChed: true
          }
        }],
        documents: {},
        checks: [
          { checkCode: 'H220' }
        ],
        itemNumber: 1,
        netMass: '9999',
        weightOrQuantity: '9999'
      }
    ],
    movementReferenceNumber: 'GB251234567890ABCD',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Current',
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
            documentCode: '9115',
            documentReference: 'GBCHD2025.1234567'
          }, {
            documentCode: 'C641',
            documentReference: 'IGNORED IUUD DOCUMENT'
          }],
          checks: [
            { checkCode: 'H224' },
            { checkCode: 'H219' }
          ]
        }],
        finalisation: {
          isManualRelease: true
        }
      },
      clearanceDecision: null,
      finalisation: {
        isManualRelease: true
      },
      updated: '2025-05-12T12:42:17.330Z'
    }],
    importPreNotifications: []
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        id: expect.any(String),
        decisions: [{
          id: expect.any(String),
          documentReference: 'GBCHD2025.1234567',
          match: false,
          outcome: {
            decision: '',
            decisionReason: null,
            decisionDetail: undefined,
            departmentCode: 'PHSI',
            isIuuOutcome: false,
            requiresChed: false
          }
        }, {
          id: expect.any(String),
          documentReference: null,
          match: null,
          outcome:
            {
              decision: '',
              decisionDetail: undefined,
              decisionReason: null,
              departmentCode: 'IUU',
              isIuuOutcome: true,
              requiresChed: false
            }
        }],
        documents: {
          'GBCHD2025.1234567': ['N851', '9115'],
          'IGNORED IUUD DOCUMENT': ['C641']
        },
        checks: [
          { checkCode: 'H224' },
          { checkCode: 'H219' }
        ],
        itemNumber: 1,
        supplementaryUnits: '12',
        weightOrQuantity: '12'
      }
    ],
    movementReferenceNumber: 'GB250123456789DCBA',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Finalised - Manually released',
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
        }]
      },
      clearanceDecision: null,
      finalisation: null,
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: []
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [{
      id: expect.any(String),
      decisions: [{
        id: expect.any(String),
        documentReference: 'GBCHD2025.0000001',
        match: false,
        outcome: {
          decision: '',
          decisionDetail: undefined,
          decisionReason: null,
          departmentCode: 'POAO',
          isIuuOutcome: false,
          requiresChed: false
        }
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
    status: 'Current',
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
        }]
      },
      clearanceDecision: null,
      finalisation: null,
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.0000002',
        status: 'SUBMITTED'
      }
    }]
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [{
      id: expect.any(String),
      decisions: [{
        id: expect.any(String),
        documentReference: 'GB.CHD.2025.0000002',
        match: true,
        outcome: {
          decision: '',
          decisionDetail: undefined,
          decisionReason: null,
          departmentCode: 'FNAO',
          isIuuOutcome: false,
          requiresChed: false
        }
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
    status: 'Current',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})

test('getDecision()', () => {
  expect(getDecision('C01'))
    .toBe('Release')

  expect(getDecision('N01'))
    .toBe('Refuse')

  expect(getDecision('E01'))
    .toBe('Data error')

  expect(getDecision('H01'))
    .toBe('Hold')

  expect(getDecision('X00'))
    .toBe('')
})

test('getCustomsDeclarationOpenState()', () => {
  expect(getCustomsDeclarationOpenState(null))
    .toBe(true)

  expect(getCustomsDeclarationOpenState({
    isManualRelease: true
  }))
    .toBe(true)

  expect(getCustomsDeclarationOpenState({
    isManualRelease: false,
    finalState: '0'
  }))
    .toBe(true)

  expect(getCustomsDeclarationOpenState({
    isManualRelease: false,
    finalState: '1'
  }))
    .toBe(false)

  expect(getCustomsDeclarationOpenState({
    isManualRelease: false,
    finalState: '2'
  }))
    .toBe(false)
})

test.each([
  { chedDecisionCode: 'H01', iuuDecisionCode: 'C07', chedDecision: 'Hold', chedDecisionDetail: 'Awaiting decision', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection complete' },
  { chedDecisionCode: 'H01', iuuDecisionCode: 'C08', chedDecision: 'Hold', chedDecisionDetail: 'Awaiting decision', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection not applicable' },
  { chedDecisionCode: 'H01', iuuDecisionCode: 'X00', chedDecision: 'Hold', chedDecisionDetail: 'Awaiting decision', iuuDecision: '', iuuDecisionDetail: 'Hold - Decision not given' },
  { chedDecisionCode: 'H02', iuuDecisionCode: 'C07', chedDecision: 'Hold', chedDecisionDetail: 'To be inspected', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection complete' },
  { chedDecisionCode: 'H02', iuuDecisionCode: 'C08', chedDecision: 'Hold', chedDecisionDetail: 'To be inspected', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection not applicable' },
  { chedDecisionCode: 'H02', iuuDecisionCode: 'X00', chedDecision: 'Hold', chedDecisionDetail: 'To be inspected', iuuDecision: '', iuuDecisionDetail: 'Hold - To be inspected' },
  { chedDecisionCode: 'X00', iuuDecisionCode: 'C07', chedDecision: '', chedDecisionDetail: 'No match', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection complete' },
  { chedDecisionCode: 'X00', iuuDecisionCode: 'C08', chedDecision: '', chedDecisionDetail: 'No match', iuuDecision: 'Release', iuuDecisionDetail: 'IUU inspection not applicable' },
  { chedDecisionCode: 'X00', iuuDecisionCode: 'X00', chedDecision: '', chedDecisionDetail: 'No match', iuuDecision: '', iuuDecisionDetail: 'No match' },
  { chedDecisionCode: 'C01', iuuDecisionCode: 'X00', chedDecision: 'Release', chedDecisionDetail: 'Customs Freight Simplified Procedures (CFSP)', iuuDecision: '', iuuDecisionDetail: 'Refuse - IUU not compliant' },
  { chedDecisionCode: 'N01', iuuDecisionCode: 'X00', chedDecision: 'Refuse', chedDecisionDetail: 'Not acceptable', iuuDecision: '', iuuDecisionDetail: 'Refuse - IUU not compliant' }
])('IUU MRN Decision CHED Check Decision Code: $chedDecisionCode, IUU Check Decision Code: $iuuDecisionCode', (options) => {
  const data = {
    customsDeclarations: [{
      movementReferenceNumber: 'GB251234567890ABCD',
      clearanceRequest: {
        declarationUcr: '5GB123456789000-BDOV123456',
        commodities: [{
          itemNumber: 1,
          netMass: '9999',
          documents: [{
            documentCode: 'N853',
            documentReference: 'GBCHD2025.1234567'
          }, {
            documentCode: 'C673',
            documentReference: 'GBIUU-VARIOUS'
          }],
          checks: [{
            checkCode: 'H222'
          }, {
            checkCode: 'H224'
          }]
        }]
      },
      clearanceDecision: {
        items: [{
          itemNumber: 1,
          checks: [{
            decisionCode: options.chedDecisionCode,
            checkCode: 'H222'
          }, {
            decisionCode: options.iuuDecisionCode,
            checkCode: 'H224'
          }]
        }]
      },
      finalisation: {
        isManualRelease: false,
        finalState: 0
      },
      updated: '2025-05-12T11:13:17.330Z'
    }],
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.1234567',
        status: 'VALIDATED'
      }
    }]
  }

  const result = mapCustomsDeclarations(data)

  const expected = [{
    commodities: [
      {
        id: expect.any(String),
        decisions: [{
          id: expect.any(String),
          documentReference: 'GBCHD2025.1234567',
          match: true,
          outcome: {
            decision: options.chedDecision,
            decisionDetail: options.chedDecisionDetail,
            decisionReason: null,
            departmentCode: 'POAO',
            isIuuOutcome: false
          }
        }, {
          id: expect.any(String),
          documentReference: null,
          match: null,
          outcome: {
            decision: options.iuuDecision,
            decisionDetail: options.iuuDecisionDetail,
            decisionReason: null,
            departmentCode: 'IUU',
            isIuuOutcome: true
          }
        }],
        documents: {
          'GBCHD2025.1234567': ['N853'],
          'GBIUU-VARIOUS': ['C673']
        },
        checks: [
          { checkCode: 'H222' },
          { checkCode: 'H224' }
        ],
        itemNumber: 1,
        netMass: '9999',
        weightOrQuantity: '9999'
      }
    ],
    movementReferenceNumber: 'GB251234567890ABCD',
    declarationUcr: '5GB123456789000-BDOV123456',
    open: true,
    status: 'Finalised - Released',
    updated: '12 May 2025, 11:13'
  }]

  expect(result).toEqual(expected)
})
