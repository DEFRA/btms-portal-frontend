import { Engine as CatboxRedis } from '@hapi/catbox-redis'
import { Engine as CatboxMemory } from '@hapi/catbox-memory'

import { buildRedisClient } from './redis-client.js'
import { config } from '../../config/config.js'
import { createLogger } from '../logger.js'

/**
 * @typedef {'redis' | 'memory'} Engine
 */

/**
 * @param {Engine} [engine]
 * @returns CatboxRedis | CatboxMemory
 */
export function getCacheEngine(engine) {
  const logger = createLogger()

  if (engine === 'redis') {
    logger.info('Using Redis session cache')
    const redisClient = buildRedisClient(config.get('redis'))
    return new CatboxRedis({
      client: redisClient,
      segment: 'session'
    })
  }

  if (config.get('isProduction')) {
    logger.error(
      'Catbox Memory is for local development only, it should not be used in production!'
    )
  }

  logger.info('Using Catbox Memory session cache')
  return new CatboxMemory({
    segment: 'session'
  })
}
