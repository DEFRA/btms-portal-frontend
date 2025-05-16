import { mapPreNotifications } from '../../../src/models/pre-notifications.js'

test('CHEDP: uses netweight, open state, decision given', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDP.GB.2025.0000001',
        status: 'VALIDATED',
        updatedSource: '2025-05-12T09:18:17.330Z',
        partOne: {
          commodities: {
            commodityComplement: [{
              complementId: '1',
              commodityId: '16041319',
              complementName: 'Sardina pilchardus'
            }],
            complementParameterSet: [{
              complementID: '1',
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
    }],
    customsDeclarations: [{
      clearanceRequest: {
        commodities: [{
          documents: [{
            documentReference: 'CHED2025.0000001',
            documentCode: 'N853'
          }]
        }]
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [{
    authorities: ['PHA - POAO'],
    commodities: [
      {
        commodityDesc: 'Sardina pilchardus',
        commodityId: '16041319',
        complementId: '1',
        weightOrQuantity: '2000'
      }
    ],
    decision: 'Acceptable for internal market',
    open: true,
    referenceNumber: 'CHEDP.GB.2025.0000001',
    status: 'Validated',
    updated: '12 May 2025, 09:18'
  }]

  expect(result).toEqual(expected)
})

test('CHEDA: uses number_animal, closed state, decision ignored', () => {
  const data = {
    importPreNotifications: [{
      importPreNotification: {
        referenceNumber: 'CHEDA.GB.2025.0000001',
        status: 'CANCELLED',
        updatedSource: '2025-04-22T16:53:17.330Z',
        partOne: {
          commodities: {
            commodityComplement: [{
              complementId: '1',
              commodityId: '0101',
              speciesName: 'Equus asinus'
            }],
            complementParameterSet: [{
              complementID: '1',
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
    }],
    customsDeclarations: [{
      clearanceRequest: {
        commodities: [{
          documents: [{
            documentReference: 'CHED2025.0000001',
            documentCode: 'N853'
          }]
        }]
      }
    }]
  }

  const result = mapPreNotifications(data)

  const expected = [{
    authorities: ['PHA - POAO'],
    commodities: [
      {
        commodityDesc: 'Equus asinus',
        commodityId: '0101',
        complementId: '1',
        weightOrQuantity: '2'
      }
    ],
    decision: 'Decision not given',
    open: false,
    referenceNumber: 'CHEDA.GB.2025.0000001',
    status: 'Cancelled',
    updated: '22 April 2025, 16:53'
  }]

  expect(result).toEqual(expected)
})
