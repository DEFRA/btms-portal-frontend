const DATE_FORMAT = 'd MMMM yyyy, HH:mm'

// PHA: Port Health Authority
const authorities = {
  ANIMAL_PLANT_HEALTH_AGENCY: 'APHA',
  HORTICULTURAL_MARKETING_INSPECTORATE: 'HMI',
  PHA_FOODS_NOT_ANIMAL_ORIGIN: 'FNAO',
  PHA_ILLEGAL_UNREPORTED_UNREGULATED: 'IUU',
  PHA_PRODUCTS_OF_ANIMAL_ORIGIN: 'POAO',
  PLANT_HEALTH_SEEDS_INSPECTORATE: 'PHSI'
}

const decisionCodeDescriptions = {
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

const checkCodeToAuthorityMapping = {
  H218: authorities.HORTICULTURAL_MARKETING_INSPECTORATE,
  H219: authorities.PLANT_HEALTH_SEEDS_INSPECTORATE,
  H220: authorities.HORTICULTURAL_MARKETING_INSPECTORATE,
  H221: authorities.ANIMAL_PLANT_HEALTH_AGENCY,
  H222: authorities.PHA_PRODUCTS_OF_ANIMAL_ORIGIN,
  H223: authorities.PHA_FOODS_NOT_ANIMAL_ORIGIN,
  H224: authorities.PHA_ILLEGAL_UNREPORTED_UNREGULATED
}

const documentCodeToAuthorityMapping = {
  C640: authorities.ANIMAL_PLANT_HEALTH_AGENCY,
  N852: authorities.PHA_FOODS_NOT_ANIMAL_ORIGIN,
  C678: authorities.PHA_FOODS_NOT_ANIMAL_ORIGIN,
  N853: authorities.PHA_PRODUCTS_OF_ANIMAL_ORIGIN,
  C673: authorities.PHA_ILLEGAL_UNREPORTED_UNREGULATED,
  C641: authorities.PHA_ILLEGAL_UNREPORTED_UNREGULATED,
  N851: authorities.PLANT_HEALTH_SEEDS_INSPECTORATE,
  C633: authorities.PLANT_HEALTH_SEEDS_INSPECTORATE,
  9115: authorities.PLANT_HEALTH_SEEDS_INSPECTORATE,
  N002: authorities.HORTICULTURAL_MARKETING_INSPECTORATE
}

const checkCodeToDocumentCodeMapping = {
  H218: ['N002'],
  H219: ['N851', '9115'],
  H220: ['N002'],
  H221: ['C640'],
  H222: ['N853'],
  H223: ['C678'],
  H224: ['C673', 'C641']
}

const IUUDocumentReferences = ['C641', 'C673']

const chedStatusDescriptions = {
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

const displayClosedChedStatuses = ['CANCELLED', 'DELETED', 'REPLACED']

const finalStateMappings = {
  0: 'Released',
  1: 'Cancelled after arrival',
  2: 'Cancelled while pre-lodged',
  3: 'Destroyed',
  4: 'Seized',
  5: 'Released to King’s warehouse',
  6: 'Transferred to MSS'
}

export {
  checkCodeToAuthorityMapping,
  checkCodeToDocumentCodeMapping,
  chedStatusDescriptions,
  decisionCodeDescriptions,
  documentCodeToAuthorityMapping,
  finalStateMappings,
  IUUDocumentReferences,
  displayClosedChedStatuses,
  DATE_FORMAT
}
