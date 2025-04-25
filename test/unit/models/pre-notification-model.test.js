import { createPreNotificationModel } from '../../../src/models/pre-notification-model.js'

const getExpectedCommodityDescription = (speciesName, commodityDescription, complementName) => {
  if (speciesName?.length) {
    return speciesName
  }
  if (commodityDescription?.length) {
    return commodityDescription
  }
  if (complementName?.length) {
    return complementName
  }
  return ''
}

describe('#createPreNotificationModel', () => {
  test('should return a model with the correct structure when a partially populated pre-notification is provided', () => {
    const testPreNotification = {
      id: 'CHEDD.GB.2024.1234567',
      commodities: [
        {
          complementId: 1,
          commodityId: '1207409000',
          additionalData: {
            netWeight: '7668.932'
          }
        }
      ],
      updatedSource: '2024-12-21T14:00:00Z'
    }
    const preNotificationModel = createPreNotificationModel(testPreNotification, [])

    expect(preNotificationModel).toEqual({
      authorities: [],
      chedRef: testPreNotification.id,
      commodities: [
        {
          commodityCode: testPreNotification.commodities[0].commodityId,
          commodityDesc: '',
          itemNumber: testPreNotification.commodities[0].complementId,
          weightOrQuantity: testPreNotification.commodities[0].additionalData.netWeight
        }
      ],
      decision: 'Decision not given',
      lastUpdated: '21 December 2024, 14:00',
      open: true,
      status: 'Unknown'
    })
  })

  test('sets Cancelled, Deleted or Replaced notifications as closed', () => {
    const testPreNotification = {
      status: 'Cancelled',
      commodities: [],
      updatedSource: '2025-04-17T16:00:00Z'
    }

    const preNotificationModel = createPreNotificationModel(testPreNotification, ['N852'])

    expect(preNotificationModel).toEqual({
      authorities: ['PHA - FNAO'],
      chedRef: testPreNotification.id,
      commodities: [],
      decision: 'Decision not given',
      lastUpdated: '17 April 2025, 16:00',
      status: 'Cancelled',
      open: false
    })
  })

  test.each([
    { commodityId: '0910', speciesName: null, commodityDescription: 'Ginger, saffron, turmeric (curcuma), thyme, bay leaves, curry and other spices', complementName: '' },
    { commodityId: '01061900', speciesName: 'Canis familiaris', commodityDescription: '', complementName: 'Canis familiaris' }
  ])('should return a model with the correct structure', ({ commodityId, speciesName, commodityDescription, complementName }) => {
    const testPreNotification = {
      id: 'CHEDD.GB.2024.1234567',
      commodities: [
        {
          complementId: 1,
          commodityDescription,
          commodityId,
          complementName,
          speciesName,
          additionalData: {
            netWeight: '580.4'
          }
        }
      ],
      partTwo: { decision: { decisionEnum: 'AcceptableForInternalMarket' } },
      status: 'Validated',
      updatedSource: '2024-12-21T14:00:00Z'
    }
    const preNotificationModel = createPreNotificationModel(testPreNotification, ['N852'])

    expect(preNotificationModel).toEqual({
      authorities: ['PHA - FNAO'],
      chedRef: testPreNotification.id,
      commodities: [
        {
          commodityCode: commodityId,
          commodityDesc: getExpectedCommodityDescription(speciesName, commodityDescription, complementName),
          itemNumber: testPreNotification.commodities[0].complementId,
          weightOrQuantity: testPreNotification.commodities[0].additionalData.netWeight
        }
      ],
      decision: 'Acceptable for internal market',
      lastUpdated: '21 December 2024, 14:00',
      status: testPreNotification.status,
      open: true
    })
  })
})
