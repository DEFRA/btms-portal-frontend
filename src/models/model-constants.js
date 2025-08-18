export const DATE_FORMAT = 'd MMMM yyyy, HH:mm'

export const ANIMAL_PLANT_HEALTH_AGENCY = 'APHA'
export const HORTICULTURAL_MARKETING_INSPECTORATE = 'HMI'
export const FOODS_NOT_ANIMAL_ORIGIN = 'FNAO'
export const ILLEGAL_UNREPORTED_UNREGULATED = 'IUU'
export const PRODUCTS_OF_ANIMAL_ORIGIN = 'POAO'
export const PLANT_HEALTH_SEEDS_INSPECTORATE = 'PHSI'
export const DECISION_NOT_GIVEN = 'Decision not given'

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

export const noMatchInternalDecisionCodes = ['E70', 'E71', 'E72', 'E73', 'E87']
