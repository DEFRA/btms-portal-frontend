export const searchKeys = {
  MRN: 'mrn',
  CHED_ID: 'chedId',
  CDS_CHED_ID: 'chedId',
  PARTIAL_CHED: 'chedId',
  CHED_LAST_SEVEN_DIGITS: 'chedId',
  DUCR: 'ducr',
  GMR_ID: 'gmrId',
  VRN_TRN: 'vrnOrTrn'
}

export const searchPatterns = [
  {
    key: searchKeys.MRN,
    pattern: /^\d{2}[A-Z]{2}[A-z0-9]{14}$/,
    description: 'MRN'
  },
  {
    key: searchKeys.CHED_ID,
    pattern: /^CHED([ADP]|P{2})\.GB\.2\d{3}\.\d{7}[VR]?$/,
    description: 'CHED'
  },
  {
    key: searchKeys.CDS_CHED_ID,
    pattern: /^GBCHD2\d{3}\.\d{7}[VR]?$/,
    description: 'CDS CHED'
  },
  {
    key: searchKeys.PARTIAL_CHED,
    pattern: /^2\d{3}\.\d{7}[VR]?$/,
    description: 'Partial CHED'
  },
  {
    key: searchKeys.CHED_LAST_SEVEN_DIGITS,
    pattern: /^\d{7}[VR]?$/,
    description: 'last 7 digits of a CHED'
  },
  {
    key: searchKeys.DUCR,
    pattern: /^\dGB\d{12}-(?:[0-9A-Z()-]{1,19})$/,
    description: 'DUCR'
  },
  {
    key: searchKeys.GMR_ID,
    pattern: /^GMR[A-Z][0-9A-Z]{8}$/,
    description: 'GMR ID'
  }
]
