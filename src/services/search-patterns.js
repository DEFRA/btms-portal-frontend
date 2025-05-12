export const searchPatterns = [
  {
    key: 'mrn',
    pattern: /^\d{2}[A-Z]{2}[A-z0-9]{14}$/,
    description: 'MRN'
  },
  {
    key: 'ched',
    pattern: /^CHED([ADP]|P{2})\.GB\.2\d{3}\.\d{7}$/,
    description: 'CHED'
  },
  {
    key: 'ched',
    pattern: /^GBCHD2\d{3}\.\d{7}$/,
    description: 'CDS CHED'
  },
  {
    key: 'ched',
    pattern: /^2\d{3}\.\d{7}$/,
    description: 'Partial CHED'
  },
  {
    key: 'ched',
    pattern: /^\d{7}$/,
    description: 'last 7 digits of a CHED'
  },
  {
    key: 'ducr',
    pattern: /^\dGB\d{12}-(?:[0-9A-Z()-]{1,19})$/,
    description: 'DUCR'
  }
]
