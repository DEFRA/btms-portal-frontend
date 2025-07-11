import { mapPreNotifications } from '../../../src/models/pre-notifications.js'

test('CHEDP: uses netweight, open state, decision given', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.0000001',
        importNotificationType: 'CVEDP',
        status: 'VALIDATED',
        updatedSource: '2025-05-12T09:18:17.330Z',
        partOne: {
          commodities: {
            commodityComplements: [{
              complementId: '1',
              commodityId: '16041319',
              complementName: 'Sardina pilchardus'
            }],
            complementParameterSets: [{
              uniqueComplementId: '5fccbd6d-c943-4d2c-8a6f-1144fcb77cf3',
              complementId: '1',
              keyDataPair: [
                { key: 'netweight', data: '2000' },
                { key: 'is_catch_certificate_required', data: 'true' }
              ]
            }]
          }
        },
        partTwo: {
          decision: {
            decision: 'Acceptable for internal market'
          }
        }
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [{
    commodities: [
      {
        id: '5fccbd6d-c943-4d2c-8a6f-1144fcb77cf3',
        commodityDesc: 'Sardina pilchardus',
        commodityId: '16041319',
        complementId: '1',
        weightOrQuantity: '2000',
        checks: [{
          authority: 'POAO',
          decision: 'Acceptable for internal market'
        }, {
          authority: 'IUU',
          decision: 'Acceptable for internal market'
        }]
      }
    ],
    ipaffsUrl: 'https://ipaffs/CHEDP.GB.2025.0000001/ched',
    open: true,
    referenceNumber: 'CHEDP.GB.2025.0000001',
    status: 'Valid',
    updated: '12 May 2025, 09:18'
  }]

  expect(result).toEqual(expected)
})

test('CHEDA: uses number_animal, closed state, decision ignored', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDA.GB.2025.0000001',
        importNotificationType: 'CVEDA',
        status: 'CANCELLED',
        updatedSource: '2025-04-22T16:53:17.330Z',
        partOne: {
          commodities: {
            commodityComplements: [{
              complementId: '1',
              commodityId: '0101',
              speciesName: 'Equus asinus'
            }],
            complementParameterSets: [{
              uniqueComplementId: 'a7959b8b-55cd-4b6e-af55-020406ac2ffa',
              complementId: '1',
              keyDataPair: [{ key: 'number_animal', data: '2' }]
            }]
          }
        },
        partTwo: {
          decision: {
            decision: 'DO NOT USE THIS DECISON'
          }
        }
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [{
    commodities: [
      {
        id: 'a7959b8b-55cd-4b6e-af55-020406ac2ffa',
        commodityDesc: 'Equus asinus',
        commodityId: '0101',
        complementId: '1',
        weightOrQuantity: '2',
        checks: [{
          authority: 'APHA',
          decision: 'Decision not given'
        }]
      }
    ],
    ipaffsUrl: 'https://ipaffs/CHEDA.GB.2025.0000001/ched',
    open: false,
    referenceNumber: 'CHEDA.GB.2025.0000001',
    status: 'Cancelled',
    updated: '22 April 2025, 16:53'
  }]

  expect(result).toEqual(expected)
})

test('CHEDPP: JOINT authority, non compliant and on hold', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDPP.GB.2025.1053629',
        importNotificationType: 'CHEDPP',
        status: 'PARTIALLY_REJECTED',
        updatedSource: '2025-07-07T13:53:17.330Z',
        partOne: {
          commodities: {
            commodityComplements: [{
              complementId: 1,
              commodityId: '8080',
              complementName: 'Musa acuminata'
            }],
            complementParameterSets: [{
              complementId: 1,
              uniqueComplementId: '02579739-23c0-444e-b1d8-006bf86e727e',
              keyDataPair: [
                { key: 'netweight', data: '220.5' },
                { key: 'regulatory_authority', data: 'JOINT' }
              ]
            }]
          }
        },
        partTwo: {
          commodityChecks: [{
            uniqueComplementId: '02579739-23c0-444e-b1d8-006bf86e727e',
            checks: [{
              type: 'PHSI_DOCUMENT',
              status: 'Compliant'
            }, {
              type: 'PHSI_IDENTITY',
              status: 'To be inspected'
            }, {
              type: 'PHSI_PHYSICAL',
              status: 'Non compliant'
            }, {
              type: 'HMI',
              status: 'Hold'
            }]
          }],
          phsiAutoCleared: null,
          hmiAutoCleared: null
        }
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [
    {
      commodities: [
        {
          checks: [
            { authority: 'PHSI', decision: 'Non compliant' },
            { authority: 'HMI', decision: 'Hold' }
          ],
          commodityDesc: 'Musa acuminata',
          commodityId: '8080',
          complementId: 1,
          id: '02579739-23c0-444e-b1d8-006bf86e727e',
          weightOrQuantity: '220.5'
        }
      ],
      ipaffsUrl: 'https://ipaffs/CHEDPP.GB.2025.1053629/ched',
      open: true,
      referenceNumber: 'CHEDPP.GB.2025.1053629',
      status: 'Partially rejected',
      updated: '7 July 2025, 13:53'
    }
  ]

  expect(result).toEqual(expected)
})

test('CHEDPP: PHSI, auto cleared', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDPP.GB.2025.1053630',
        importNotificationType: 'CHEDPP',
        status: 'VALIDATED',
        updatedSource: '2025-07-07T14:55:17.330Z',
        partOne: {
          commodities: {
            commodityComplements: [{
              complementId: 1,
              commodityId: '10909',
              speciesName: 'Malus domestica'
            }],
            complementParameterSets: [{
              complementId: 1,
              uniqueComplementId: 'cff4e34e-ffa1-4a63-8f67-af48b3dc27b4',
              keyDataPair: [
                { key: 'netweight', data: '1000' },
                { key: 'regulatory_authority', data: 'PHSI' }
              ]
            }]
          }
        },
        partTwo: {
          commodityChecks: [{
            uniqueComplementId: 'cff4e34e-ffa1-4a63-8f67-af48b3dc27b4',
            checks: [{
              type: 'PHSI_DOCUMENT',
              status: 'Auto cleared'
            }, {
              type: 'PHSI_IDENTITY',
              status: 'Auto cleared'
            }, {
              type: 'PHSI_PHYSICAL',
              status: 'Auto cleared'
            }]
          }],
          phsiAutoCleared: true,
          hmiAutoCleared: true
        }
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [
    {
      commodities: [
        {
          checks: [
            { authority: 'PHSI', decision: 'Auto cleared' }
          ],
          commodityDesc: 'Malus domestica',
          commodityId: '10909',
          complementId: 1,
          id: 'cff4e34e-ffa1-4a63-8f67-af48b3dc27b4',
          weightOrQuantity: '1000'
        }
      ],
      ipaffsUrl: 'https://ipaffs/CHEDPP.GB.2025.1053630/ched',
      open: true,
      referenceNumber: 'CHEDPP.GB.2025.1053630',
      status: 'Valid',
      updated: '7 July 2025, 14:55'
    }
  ]

  expect(result).toEqual(expected)
})

test('CHEDPP: HMI, no decision', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDPP.GB.2025.1053631',
        importNotificationType: 'CHEDPP',
        status: 'SUBMITTED',
        updatedSource: '2025-07-07T15:10:27.330Z',
        partOne: {
          commodities: {
            commodityComplements: [{
              complementId: 1,
              commodityId: '3333',
              complementName: 'Malus baccata'
            }],
            complementParameterSets: [{
              complementId: 1,
              uniqueComplementId: 'f06f6c4a-d108-48ea-9cc1-36641308826d',
              keyDataPair: [
                { key: 'netweight', data: '404' },
                { key: 'regulatory_authority', data: 'HMI' }
              ]
            }]
          }
        },
        partTwo: {
          commodityChecks: [{
            uniqueComplementId: 'f06f6c4a-d108-48ea-9cc1-36641308826d',
            checks: []
          }],
          phsiAutoCleared: null,
          hmiAutoCleared: null
        }
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [{
    commodities: [
      {
        checks: [
          { authority: 'HMI', decision: 'Decision not given' }
        ],
        commodityDesc: 'Malus baccata',
        commodityId: '3333',
        complementId: 1,
        id: 'f06f6c4a-d108-48ea-9cc1-36641308826d',
        weightOrQuantity: '404'
      }
    ],
    ipaffsUrl: 'https://ipaffs/CHEDPP.GB.2025.1053631/ched',
    open: true,
    referenceNumber: 'CHEDPP.GB.2025.1053631',
    status: 'New',
    updated: '7 July 2025, 15:10'
  }]

  expect(result).toEqual(expected)
})
