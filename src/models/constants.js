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
  H218: 'HMI',
  H219: 'PHSI',
  H220: 'HMI',
  H221: 'APHA',
  H222: 'PHA - POAO',
  H223: 'PHA - FNAO',
  H224: 'PHA - IUU'
}

const documentCodeToAuthorityMapping = {
  C640: 'APHA',
  N852: 'PHA - FNAO',
  C678: 'PHA - FNAO',
  N853: 'PHA - POAO',
  C673: 'PHA - IUU',
  C641: 'PHA - IUU',
  N851: 'PHSI',
  C633: 'PHSI',
  9115: 'PHSI',
  N002: 'HMI'
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

export {
  checkCodeToAuthorityMapping,
  chedDecisionDescriptions,
  chedStatusDescriptions,
  decisionCodeDescriptions,
  documentCodeToAuthorityMapping
}
