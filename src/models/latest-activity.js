import { format } from 'date-fns'

const latestActivityMessage = (type, subtype, timestamp) => ({
  type,
  subtype,
  timestamp: timestamp ? format(new Date(timestamp), 'dd MMMM yyyy, HH:mm:ss') : 'No Data Available'
})

const tracesService = (lastReceived) => ({
  name: 'TRACES',
  direction: 'received',
  messages: [
    latestActivityMessage(
      'Notification',
      null,
      lastReceived.tracesChed?.timestamp
    )
  ]
})

export const mapLatestActivity = (lastCreated, lastSent, lastReceived, showTracesCheds = false) => ({
  services: [
    {
      name: 'BTMS',
      direction: 'updated',
      messages: [
        latestActivityMessage('Decision created', 'BTMS', lastCreated.decision?.timestamp),
        latestActivityMessage('Decision sent', 'BTMS to CDS', lastSent.decision?.timestamp)
      ]
    },
    {
      name: 'CDS',
      direction: 'received',
      messages: [
        latestActivityMessage(
          'Clearance request',
          null,
          lastReceived.clearanceRequest?.timestamp
        ),
        latestActivityMessage(
          'Finalisation',
          null,
          lastReceived.finalisation?.timestamp
        )
      ]
    },
    {
      name: 'IPAFFS',
      direction: 'received',
      messages: [
        latestActivityMessage(
          'Notification',
          null,
          lastReceived.preNotification?.timestamp
        )
      ]
    },
    ...(showTracesCheds ? [tracesService(lastReceived)] : [])
  ]
})
