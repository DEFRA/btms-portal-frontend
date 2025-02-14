const searchPatterns = {
  CHED_REF: /^CHED([ADP]|P{2})\.GB\.2\d{3}\.\d{7}$/,
  CDS_CHED_REF: /^GBCHD2\d{3}\.\d{7}$/,
  PARTIAL_CHED_REF: /2\d{3}\.\d{7}$/,
  NUMERIC_ONLY_CHED_REF: /\d{7}/,
  MOVEMENT_REF: /^\d{2}[A-Z]{2}[A-z0-9]{14}$/
}

const searchTypes = {
  CUSTOMS_DECLARATION: 'customs-declaration',
  PRE_NOTIFICATION: 'pre-notification',
  PRE_NOTIFICATION_PARTIAL_REF: 'partial-ref-pre-notification'
}

const CDS_CHED_REF_PREFIX = 'GBCHD'

export {
  CDS_CHED_REF_PREFIX,
  searchPatterns,
  searchTypes
}
