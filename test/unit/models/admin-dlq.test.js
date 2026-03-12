import { mapDlqs } from '../../../src/models/admin-dlq.js'

const dlqCOnfigs = {
  groups: [
    {
      groupName: 'Service 1 DLQs',
      queues: [
        {
          queueName: 'Service 1 Queue 1',
          sqsQueueName: 'service_1_queue_1-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive'
        }
      ]
    },
    {
      groupName: 'Service 2 DLQs',
      queues: [
        {
          queueName: 'Service 2 Queue 1',
          sqsQueueName: 'service_2_queue_1-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive'
        },
        {
          queueName: 'Service 2 Queue 2',
          sqsQueueName: 'service_2_queue_2-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive'
        }
      ]
    }
  ]
}

const queueCounts = [
  {
    sqsQueueName: 'service_1_queue_1-deadletter',
    count: 0
  },
  {
    sqsQueueName: 'service_2_queue_1-deadletter',
    count: 1
  },
  {
    sqsQueueName: 'service_2_queue_2-deadletter',
    count: 2
  }
]


test('Should map configs and counts to model', () => {
  const expected = [
    {
      groupName: 'Service 1 DLQs',
      queues: [
        {
          queueName: 'Service 1 Queue 1',
          sqsQueueName: 'service_1_queue_1-deadletter',
          queueCount: 0
        }
      ]
    },
    {
      groupName: 'Service 2 DLQs',
      queues: [
        {
          queueName: 'Service 2 Queue 1',
          sqsQueueName: 'service_2_queue_1-deadletter',
          queueCount: 1
        },
        {
          queueName: 'Service 2 Queue 2',
          sqsQueueName: 'service_2_queue_2-deadletter',
          queueCount: 2
        }
      ]
    }
  ]

  const result = mapDlqs(dlqCOnfigs, queueCounts)

  expect(result).toEqual(expected)
})

test('Should map empty DLQ Configs', () => {
  const expected = []

  const result = mapDlqs({}, [])

  expect(result).toEqual(expected)
})

test('Should map empty DLQ Groups', () => {
  const expected = []

  const result = mapDlqs({ groups: undefined }, [])

  expect(result).toEqual(expected)
})

test('Should map empty DLQ Group Queues', () => {
  const invalidConfig = {
    groups: [
      {
        groupName: 'Service 1 DLQs',
        queues: undefined
      }
    ]
  }
  const expected = [
    {
      groupName: "Service 1 DLQs",
      queues: []
    }
  ]

  const result = mapDlqs(invalidConfig, [])

  expect(result).toEqual(expected)
})
