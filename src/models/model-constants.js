export const DATE_FORMAT = 'd MMMM yyyy, HH:mm'

export const ANIMAL_PLANT_HEALTH_AGENCY = 'APHA'
export const HORTICULTURAL_MARKETING_INSPECTORATE = 'HMI'
export const HORTICULTURAL_MARKETING_INSPECTORATE_SMS = 'HMI - SMS'
export const HORTICULTURAL_MARKETING_INSPECTORATE_GMS = 'HMI - GMS'
export const FOODS_NOT_ANIMAL_ORIGIN = 'FNAO'
export const ILLEGAL_UNREPORTED_UNREGULATED = 'IUU'
export const PRODUCTS_OF_ANIMAL_ORIGIN = 'POAO'
export const PLANT_HEALTH_SEEDS_INSPECTORATE = 'PHSI'
export const DECISION_NOT_GIVEN = 'Decision not given'
export const NO_MATCH_DECISION_CODE = 'X00'

export const chedTypes = {
  CHEDA: 'CVEDA',
  CHEDD: 'CED',
  CHEDP: 'CVEDP',
  CHEDPP: 'CHEDPP'
}

export const checkStatusToOutcome = {
  Hold: 'Hold',
  'To do': 'Hold',
  'To be inspected': 'Hold',
  Compliant: 'Compliant',
  'Auto cleared': 'Compliant',
  'Not inspected': 'Compliant',
  'Non compliant': 'Non compliant'
}

export const decisionCodeDescriptions = {
  C01: 'Customs Freight Simplified Procedures (CFSP)',
  C02: 'No inspection required',
  C03: 'Inspection complete',
  C05: 'Inspection complete temporary admission',
  C06: 'Inspection complete T5 procedure',
  C07: 'IUU inspection complete',
  C08: 'IUU inspection not applicable',
  E01: 'Data error SFD vs Non CFSP loc',
  E02: 'Data error full dec vs CFSP loc',
  E03: 'Unexpected data - transit, transhipment or specific warehouse',
  H01: 'Awaiting decision',
  H02: 'To be inspected',
  N01: 'Not acceptable',
  N02: 'Destroy',
  N03: 'Transform',
  N04: 'Re-export or re-dispatch',
  N05: 'Use for other purposes',
  N06: 'Refused',
  N07: 'Not acceptable',
  X00: 'No match'
}

export const checkCodeToAuthorityMapping = {
  H218: HORTICULTURAL_MARKETING_INSPECTORATE,
  H219: PLANT_HEALTH_SEEDS_INSPECTORATE,
  H220: HORTICULTURAL_MARKETING_INSPECTORATE,
  H221: ANIMAL_PLANT_HEALTH_AGENCY,
  H222: PRODUCTS_OF_ANIMAL_ORIGIN,
  H223: FOODS_NOT_ANIMAL_ORIGIN,
  H224: ILLEGAL_UNREPORTED_UNREGULATED
}

export const checkCodeToAuthorityNameMapping = {
  H218: HORTICULTURAL_MARKETING_INSPECTORATE_SMS,
  H220: HORTICULTURAL_MARKETING_INSPECTORATE_GMS
}

export const checkCodeToDocumentCodeMapping = {
  H218: ['N002', 'C085'],
  H219: ['N851', '9115', 'C085'],
  H220: ['N002', 'C085'],
  H221: ['C640'],
  H222: ['N853'],
  H223: ['C678'],
  H224: ['C673', 'C641']
}

export const IUUDocumentCodes = ['C641', 'C673']

export const chedStatusDescriptions = {
  AMEND: 'Amend',
  CANCELLED: 'Cancelled',
  DELETED: 'Deleted',
  IN_PROGRESS: 'In progress',
  MODIFY: 'Modify',
  PARTIALLY_REJECTED: 'Partially rejected',
  REJECTED: 'Rejected',
  REPLACED: 'Replaced',
  SPLIT_CONSIGNMENT: 'Split consignment',
  SUBMITTED: 'New',
  VALIDATED: 'Valid'
}

export const closedChedStatuses = ['CANCELLED', 'REPLACED']

export const finalStateMappings = {
  0: 'Released',
  1: 'Cancelled after arrival',
  2: 'Cancelled while pre-lodged',
  3: 'Destroyed',
  4: 'Seized',
  5: 'Released to King’s warehouse',
  6: 'Transferred to MSS'
}

export const iuuDecisionDisplay = {
  IUUOK: 'IUU inspection complete',
  IUUNotCompliant: 'IUU not compliant',
  IUUNA: 'IUU inspection not applicable'
}

export const hmiGmsInternalDecisionCodes = new Set(['E87', 'E82'])
export const noMatchInternalDecisionCodes = new Set([
  'E70',
  'E71',
  'E72',
  'E73',
  'E75',
  'E82',
  'E83',
  'E84',
  'E87',
  'E99'
])
export const internalDecisionCodeDescriptions = {
  E70: 'No match - CHED cannot be found',
  E71: 'No match - CHED cancelled',
  E72: 'No match - CHED replaced',
  E73: 'No match - CHED deleted',
  E74: 'Hold - Partially rejected',
  E75: 'No match - Split consignment',
  E82: 'No match - Selected for HMI GMS inspection',
  E83: 'No match',
  E84: 'No match - Incorrect CHED type',
  E85: 'Hold - PHSI decision not provided',
  E86: 'Hold - HMI decision not provided',
  E87: 'No match - Selected for HMI GMS inspection',
  E88: 'Hold - Awaiting IPAFFS update',
  E99: 'No match - Unknown error'
}

// Order of these checks matter. It returns the 'worst' case of all the item decisions first.
export const ORDERED_CLEARANCE_DECISIONS = [
  { type: 'item', code: 'E03', description: `Data Error - ${decisionCodeDescriptions.E03}` },
  { type: 'item', code: 'N01', description: `Refuse - ${decisionCodeDescriptions.N01}` },
  { type: 'item', code: 'N02', description: `Refuse - ${decisionCodeDescriptions.N02}` },
  { type: 'item', code: 'N03', description: `Refuse - ${decisionCodeDescriptions.N03}` },
  { type: 'item', code: 'N04', description: `Refuse - ${decisionCodeDescriptions.N04}` },
  { type: 'item', code: 'N05', description: `Refuse - ${decisionCodeDescriptions.N05}` },
  { type: 'item', code: 'N06', description: `Refuse - ${decisionCodeDescriptions.N06}` },
  { type: 'item', code: 'N07', description: `Refuse - ${decisionCodeDescriptions.N07}` },
  { type: 'item', code: 'X00', checkCode: 'H224', description: `Refuse - ${iuuDecisionDisplay.IUUNotCompliant}` },
  { type: 'result', code: 'E70', description: internalDecisionCodeDescriptions.E70 },
  { type: 'result', code: 'E71', description: internalDecisionCodeDescriptions.E71 },
  { type: 'result', code: 'E72', description: internalDecisionCodeDescriptions.E72 },
  { type: 'result', code: 'E73', description: internalDecisionCodeDescriptions.E73 },
  { type: 'result', code: 'E75', description: internalDecisionCodeDescriptions.E75 },
  { type: 'result', code: 'E87', description: internalDecisionCodeDescriptions.E87 },
  { type: 'result', code: 'E84', description: internalDecisionCodeDescriptions.E84 },
  { type: 'result', code: 'E99', description: internalDecisionCodeDescriptions.E99 },
  { type: 'item', code: 'H01', description: `Hold - ${DECISION_NOT_GIVEN}` },
  { type: 'item', code: 'H02', description: `Hold - ${decisionCodeDescriptions.H02}` },
  { type: 'result', code: 'E88', description: internalDecisionCodeDescriptions.E88 },
  { type: 'result', code: 'E74', description: internalDecisionCodeDescriptions.E74 },
  { type: 'result', code: 'E85', description: internalDecisionCodeDescriptions.E85 },
  { type: 'result', code: 'E86', description: internalDecisionCodeDescriptions.E86 },
  { type: 'item', code: 'C02', description: `Release - ${decisionCodeDescriptions.C02}` },
  { type: 'item', code: 'C03', description: `Release - ${decisionCodeDescriptions.C03}` },
  { type: 'item', code: 'C05', description: `Release - ${decisionCodeDescriptions.C05}` },
  { type: 'item', code: 'C06', description: `Release - ${decisionCodeDescriptions.C06}` },
  { type: 'item', code: 'C07', description: `Release - ${decisionCodeDescriptions.C07}` },
  { type: 'item', code: 'C08', description: `Release - ${decisionCodeDescriptions.C08}` }
]

export const ORDERED_CDS_STATUSES = [
  'In progress - Awaiting trader',
  'In progress - Awaiting IPAFFS',
  'In progress - Awaiting CDS',
  'In progress',
  'Finalised - Manually released',
  'Finalised - Released',
  'Unknown'
]
