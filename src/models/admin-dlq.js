export const mapDlqs = (dlqConfigs, queueCounts) => {
  return dlqConfigs?.groups?.map(group => {
    return {
      groupName: group.groupName,
      queues: group?.queues?.map(queue => {
        const queueCount = queueCounts.find(count => count.sqsQueueName === queue.sqsQueueName)

        return {
          queueName: queue.queueName,
          sqsQueueName: queue.sqsQueueName,
          queueCount: queueCount?.count
        }
      }) || []
    }
  }) || []
}
