import { mapFisNotifications } from '../../../src/models/fis-notifications.js'

test('should map FIS notification reference, status and last updated', () => {
  const searchResults = {
    iuus: [
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000001",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:00:00.000Z"
        }
      }
    ]
  }

  expect(mapFisNotifications(searchResults, 'IUU.GB.2026.0000001')).toEqual([
    {
      reference: "IUU.GB.2026.0000001",
      status: "IUUOK",
      updated: "27 October 2026, 09:00"
    }
  ])
})

test('should order FIS notifications by searched IUU Reference first, then by updated', () => {
  const searchResults = {
    iuus: [
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000001",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:01:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000002",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:00:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000003",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:03:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000004",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:02:00.000Z"
        }
      }
    ]
  }

  expect(mapFisNotifications(searchResults, 'IUU.GB.2026.0000001')).toEqual([
    {
      reference: "IUU.GB.2026.0000001",
      status: "IUUOK",
      updated: "27 October 2026, 09:01"
    },
    {
      reference: "IUU.GB.2026.0000003",
      status: "IUUOK",
      updated: "27 October 2026, 09:03"
    },
    {
      reference: "IUU.GB.2026.0000004",
      status: "IUUOK",
      updated: "27 October 2026, 09:02"
    },
    {
      reference: "IUU.GB.2026.0000002",
      status: "IUUOK",
      updated: "27 October 2026, 09:00"
    }
  ])
})

test('search by MRN should sort FIS Notifications by updated', () => {
  const searchResults = {
    iuus: [
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000001",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:01:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000002",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:00:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000003",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:03:00.000Z"
        }
      },
      {
        iuuNotification: {
          reference: "IUU.GB.2026.0000004",
          iuuOption: "IUUOK",
          lastUpdated: "2026-10-27T09:02:00.000Z"
        }
      }
    ]
  }

  expect(mapFisNotifications(searchResults, 'GB251234567890ABCD')).toEqual([
    {
      reference: "IUU.GB.2026.0000003",
      status: "IUUOK",
      updated: "27 October 2026, 09:03"
    },
    {
      reference: "IUU.GB.2026.0000004",
      status: "IUUOK",
      updated: "27 October 2026, 09:02"
    },
    {
      reference: "IUU.GB.2026.0000001",
      status: "IUUOK",
      updated: "27 October 2026, 09:01"
    },
    {
      reference: "IUU.GB.2026.0000002",
      status: "IUUOK",
      updated: "27 October 2026, 09:00"
    }
  ])
})
