import { getAuthorities, mapPreNotifications } from '../../../src/models/pre-notifications.js'

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
              keyDataPair: [{ key: 'netweight', data: '2000' }]
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
        authorities: ['POAO']
      }
    ],
    decision: 'Acceptable for internal market',
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
        authorities: ['APHA'],
        id: 'a7959b8b-55cd-4b6e-af55-020406ac2ffa',
        commodityDesc: 'Equus asinus',
        commodityId: '0101',
        complementId: '1',
        weightOrQuantity: '2'
      }
    ],
    decision: 'Decision not given',
    ipaffsUrl: 'https://ipaffs/CHEDA.GB.2025.0000001/ched',
    open: false,
    referenceNumber: 'CHEDA.GB.2025.0000001',
    status: 'Cancelled',
    updated: '22 April 2025, 16:53'
  }]

  expect(result).toEqual(expected)
})

test('getAuthorities(): CHEDA', () => {
  const importNotificationType = 'CVEDA'

  expect(getAuthorities(importNotificationType, {}))
    .toEqual(['APHA'])
})

test('getAuthorities(): CHEDD', () => {
  const importNotificationType = 'CED'

  expect(getAuthorities(importNotificationType, {}))
    .toEqual(['FNAO'])
})

test('getAuthorities(): CHEDP', () => {
  const importNotificationType = 'CVEDP'

  expect(getAuthorities(importNotificationType, {}))
    .toEqual(['POAO'])
})

test('getAuthorities(): CHEDPP JOINT', () => {
  const importNotificationType = 'CHEDPP'
  const complementParameterSet = {
    keyDataPair: [{
      key: 'regulatory_authority',
      data: 'JOINT'
    }]
  }
  expect(getAuthorities(importNotificationType, complementParameterSet))
    .toEqual(['PHSI', 'HMI'])
})

test('getAuthorities(): CHEDPP PHSI', () => {
  const importNotificationType = 'CHEDPP'
  const complementParameterSet = {
    keyDataPair: [{
      key: 'regulatory_authority',
      data: 'PHSI'
    }]
  }
  expect(getAuthorities(importNotificationType, complementParameterSet))
    .toEqual(['PHSI'])
})

test('getAuthorities(): CHEDPP HMI', () => {
  const importNotificationType = 'CHEDPP'
  const complementParameterSet = {
    keyDataPair: [{
      key: 'regulatory_authority',
      data: 'HMI'
    }]
  }
  expect(getAuthorities(importNotificationType, complementParameterSet))
    .toEqual(['HMI'])
})
