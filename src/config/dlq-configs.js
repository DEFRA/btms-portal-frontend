export const dlqConfigs = {
  groups: [
    {
      groupName: 'BTMS Gateway',
      queues: [
        {
          queueName: 'BTMS Gateway',
          sqsQueueName: 'trade_imports_data_upserted_btms-gateway-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive',
          drainEndpoint: 'admin/dlq/drain'
        }
      ]
    },
    {
      groupName: 'Processor',
      queues: [
        {
          queueName: 'Customs Declarations Processor',
          sqsQueueName: 'trade_imports_inbound_customs_declarations_processor-deadletter.fifo',
          countEndpoint: 'admin/customs-declarations/dlq/count',
          redriveEndpoint: 'admin/customs-declarations/dlq/redrive',
          drainEndpoint: 'admin/customs-declarations/dlq/drain'
        },
        {
          queueName: 'Upserted Processor',
          sqsQueueName: 'trade_imports_data_upserted_processor-deadletter',
          countEndpoint: 'admin/resource-events/dlq/count',
          redriveEndpoint: 'admin/resource-events/dlq/redrive',
          drainEndpoint: 'admin/resource-events/dlq/drain'
        }
      ]
    },
    {
      groupName: 'Reporting',
      queues: [
        {
          queueName: 'Upserted Reporting API',
          sqsQueueName: 'trade_imports_data_upserted_reporting_api-deadletter',
          countEndpoint: 'admin/dlq/resource-events/count',
          redriveEndpoint: 'admin/dlq/resource-events/redrive',
          drainEndpoint: 'admin/dlq/resource-events/drain'
        },
        {
          queueName: 'Activity Reporting API',
          sqsQueueName: 'trade_imports_btms_activity_reporting_api-deadletter',
          countEndpoint: 'admin/dlq/activity-events/count',
          redriveEndpoint: 'admin/dlq/activity-events/redrive',
          drainEndpoint: 'admin/dlq/activity-events/drain'
        }
      ]
    },
    {
      groupName: 'Decision Deriver',
      queues: [
        {
          queueName: 'Decision Deriver',
          sqsQueueName: 'trade_imports_data_upserted_decision_deriver-deadletter',
          countEndpoint: 'admin/dlq/count',
          redriveEndpoint: 'admin/dlq/redrive',
          drainEndpoint: 'admin/dlq/drain'
        }
      ]
    }
  ]
}
