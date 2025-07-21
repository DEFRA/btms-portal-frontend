export const searchPatterns = [
  {
    key: 'mrn',
    pattern: /^\d{2}[A-Z]{2}[A-z0-9]{14}$/,
    description: 'MRN'
  },
  {
    key: 'chedId',
    pattern: /^CHED([ADP]|P{2})\.GB\.2\d{3}\.\d{7}[VR]?$/,
    description: 'CHED'
  },
  {
    key: 'chedId',
    pattern: /^GBCHD2\d{3}\.\d{7}[VR]?$/,
    description: 'CDS CHED'
  },
  {
    key: 'chedId',
    pattern: /^2\d{3}\.\d{7}[VR]?$/,
    description: 'Partial CHED'
  },
  {
    key: 'chedId',
    pattern: /^\d{7}[VR]?$/,
    description: 'last 7 digits of a CHED'
  },
  {
    key: 'ducr',
    pattern: /^\dGB\d{12}-(?:[0-9A-Z()-]{1,19})$/,
    description: 'DUCR'
  }
]
