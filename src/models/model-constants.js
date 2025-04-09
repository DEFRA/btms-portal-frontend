const CHED_REF_NUMERIC_IDENTIFIER_INDEX = 3
const DATE_FORMAT = 'd MMMM yyyy, HH:mm'

// PHA: Port Health Authority
const authorities = {
  ANIMAL_PLANT_HEALTH_AGENCY: 'APHA',
  HORTICULTURAL_MARKETING_INSPECTORATE: 'HMI',
  PHA_FOODS_NOT_ANIMAL_ORIGIN: 'PHA - FNAO',
  PHA_ILLEGAL_UNREPORTED_UNREGULATED: 'PHA - IUU',
  PHA_PRODUCTS_OF_ANIMAL_ORIGIN: 'PHA - POAO',
  PLANT_HEALTH_SEEDS_INSPECTORATE: 'PHSI'
}

const decisionCodeDescriptions = {
  C01: 'Customs Freight Simplified Procedures (CFSP)',
  C02: 'No Inspection Required',
  C03: 'Inspection Complete',
  C05: 'Inspection Complete Temporary Admission',
  C06: 'Inspection Complete T5 Procedure',
  C07: 'IUU inspection complete',
  C08: 'IUU inspection not applicable',
  E01: 'Data Error SFD vs Non CFSP loc',
  E02: 'Data Error Full Dec vs CFSP loc',
  E03: 'Unexpected data - Transit, Transhipment or Specific Warehouse',
  H01: 'Awaiting Decision',
  H02: 'To Be Inspected',
  N01: 'Not acceptable',
  N02: 'Destroy',
  N03: 'Transform',
  N04: 'Re-export or re-dispatch',
  N05: 'Use for other purposes',
  N06: 'Refusal',
  N07: 'Not acceptable',
  X00: 'No Match'
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

const chedStatusDescriptions = {
  Amend: 'Amend',
  Cancelled: 'Cancelled',
  Deleted: 'Deleted',
  InProgress: 'In progress',
  Modify: 'Modify',
  PartiallyRejected: 'Partially rejected',
  Rejected: 'Rejected',
  Replaced: 'Replaced',
  SplitConsignment: 'Split consignment',
  Submitted: 'Submitted',
  Validated: 'Validated'
}

const chedDecisionDescriptions = {
  AcceptableForInternalMarket: 'Acceptable for internal market',
  AcceptableForSpecificWarehouse: 'Acceptable for specific warehouse',
  AcceptableForTemporaryImport: 'Acceptable for temporary import',
  AcceptableForTranshipment: 'Acceptable for transhipment',
  AcceptableForTransit: 'Acceptable for transit',
  AcceptableIfChanneled: 'Acceptable if channeled',
  NonAcceptable: 'Non acceptable'
}

const finalStateMappings = {
  Cleared: 'Released',
  CancelledAfterArrival: 'Cancelled',
  CancelledWhilePreLodged: 'Cancelled',
  Destroyed: 'Destroyed',
  Seized: 'Seized',
  ReleasedToKingsWarehouse: 'Released to warehouse',
  TransferredToMss: 'Transferred to MSS'
}

export {
  checkCodeToAuthorityMapping,
  chedDecisionDescriptions,
  chedStatusDescriptions,
  decisionCodeDescriptions,
  documentCodeToAuthorityMapping,
  finalStateMappings,
  CHED_REF_NUMERIC_IDENTIFIER_INDEX,
  DATE_FORMAT
}
