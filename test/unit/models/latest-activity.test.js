import { mapLatestActivity } from '../../../src/models/latest-activity'

const lastCreated = { decision: null }
const lastSent = { decision: null }
const lastReceived = {
  finalisation: null,
  clearanceRequest: null,
  preNotification: null,
  tracesChed: {
    timestamp: '2025-10-13T11:45:12.123Z',
    reference: 'CHEDP.GB.2025.1234567'
  }
}

const serviceNames = (latestActivity) =>
  latestActivity.services.map(({ name }) => name)

test('does not include TRACES when the flag is not provided', () => {
  const actual = mapLatestActivity(lastCreated, lastSent, lastReceived)

  expect(serviceNames(actual)).toEqual(['BTMS', 'CDS', 'IPAFFS'])
})

test('does not include TRACES when the flag is off', () => {
  const actual = mapLatestActivity(lastCreated, lastSent, lastReceived, false)

  expect(serviceNames(actual)).toEqual(['BTMS', 'CDS', 'IPAFFS'])
})

test('includes the last TRACES CHED received when the flag is on', () => {
  const actual = mapLatestActivity(lastCreated, lastSent, lastReceived, true)

  expect(serviceNames(actual)).toEqual(['BTMS', 'CDS', 'IPAFFS', 'TRACES'])
  expect(actual.services[3]).toEqual({
    name: 'TRACES',
    direction: 'received',
    messages: [
      {
        type: 'Notification',
        subtype: null,
        timestamp: '13 October 2025, 11:45:12'
      }
    ]
  })
})

test('shows no data for TRACES when the flag is on and no CHED has been received', () => {
  const actual = mapLatestActivity(lastCreated, lastSent, {}, true)

  expect(actual.services[3].messages).toEqual([
    {
      type: 'Notification',
      subtype: null,
      timestamp: 'No Data Available'
    }
  ])
})
