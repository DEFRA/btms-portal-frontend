import path from 'path'
import hapi from '@hapi/hapi'
import bell from '@hapi/bell'
import { config } from './config/config.js'
import plugins from './plugins/index.js'
import { getCacheEngine } from './utils/caching/cache-engine.js'

export async function createServer () {
  const server = hapi.server({
    port: config.get('port'),
    routes: {
      auth: {
        mode: 'try'
      },
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(
          /** @type {Engine} */ (config.get('session.cache.engine'))
        )
      }
    ],
    state: {
      strictHeader: false
    }
  })

  server.app.cache = server.cache({
    cache: 'session',
    expiresIn: config.get('session.cache.ttl'),
    segment: 'session'
  })

  await server.register(bell)
  await server.register(plugins)

  return server
}

/**
 * @import {Engine} from './src/server/common/helpers/session-cache/cache-engine.js'
 */
