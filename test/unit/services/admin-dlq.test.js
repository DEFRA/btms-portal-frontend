import wreck from '@hapi/wreck'
import { getDlqCounts } from '../../../src/services/admin-dlq.js'

const unexpectedDlqConfigs = {
  groups: [
    {
      groupName: 'Expected Service Group',
      queues: [
        {
          queueName: 'Expected Service Queue',
          sqsQueueName: 'unexpected_service_queue-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive'
        }
      ]
    }
  ]
}

const dlqConfigs = {
  groups: [
    {
      groupName: 'BTMS Gateway',
      queues: [
        {
          queueName: 'BTMS Gateway',
          sqsQueueName: 'trade_imports_data_upserted_btms-gateway-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive'
        }
      ]
    }
  ]
}

jest.mock('@hapi/wreck', () => ({
  get: jest.fn()
}))

test('Should contain count failure when get count for unexpected group', async () => {
  const result = await getDlqCounts(unexpectedDlqConfigs)

  expect(result).toEqual([
    {
      sqsQueueName: 'unexpected_service_queue-deadletter',
      count: 'Retrieve count failed'
    }
  ])
})

test('Should contain count failure when get count returns upstream error', async () => {
  wreck.get.mockRejectedValue({ output: { statusCode: 500 }, message: 'Server error' })

  const result = await getDlqCounts(dlqConfigs)

  expect(result).toEqual([
    {
      sqsQueueName: 'trade_imports_data_upserted_btms-gateway-deadletter',
      count: 'Retrieve count failed'
    }
  ])
})
