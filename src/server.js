import path from 'path'
import hapi from '@hapi/hapi'

import { config } from './config/config.js'
import plugins from './plugins/index.js'
import { getCacheEngine } from './utils/caching/cache-engine.js'
import { getUserSession } from './plugins/auth/get-user-session.js'
import { dropUserSession } from './plugins/auth/drop-user-session.js'

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
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
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

  server.decorate('request', 'getUserSession', getUserSession)
  server.decorate('request', 'dropUserSession', dropUserSession)

  await server.register(plugins)

  return server
}

/**
 * @import {Engine} from './src/server/common/helpers/session-cache/cache-engine.js'
 */
