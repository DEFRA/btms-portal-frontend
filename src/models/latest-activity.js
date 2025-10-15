import { format } from 'date-fns'

const latestActivityMessage = (type, timestamp) => ({
  type,
  timestamp: format(new Date(timestamp), 'dd MMMM yyyy, HH:mm')
})

export const mapLatestActivity = (lastSent, lastReceived) => ({
  services: [
    {
      name: 'BTMS',
      direction: 'sent',
      messages: [latestActivityMessage('Decision', lastSent.decision.timestamp)]
    },
    {
      name: 'CDS',
      direction: 'received',
      messages: [
        latestActivityMessage(
          'Clearance request',
          lastReceived.clearanceRequest.timestamp
        ),
        latestActivityMessage(
          'Finalisation',
          lastReceived.finalisation.timestamp
        )
      ]
    },
    {
      name: 'IPAFFS',
      direction: 'received',
      messages: [
        latestActivityMessage(
          'Notification',
          lastReceived.preNotification.timestamp
        )
      ]
    }
  ]
})
