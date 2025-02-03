import inert from '@hapi/inert'
import routes from '../routes/index.js'

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([inert])
      server.route(routes)
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
