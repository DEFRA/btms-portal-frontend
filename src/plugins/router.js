import inert from '@hapi/inert'

import { health } from '../routes/health.js'
import { staticAssetRoutes } from '../routes/static-assets.js'
import { home } from '../routes/home.js'
import { search } from '../routes/search.js'
import { searchResult } from '../routes/search-result.js'

/**
 * @satisfies {ServerRegisterPluginObject<void>}
 */
export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([inert])

      const appSpecificRoutes = [
        home,
        ...search,
        searchResult]

      server.route([health, ...staticAssetRoutes].concat(appSpecificRoutes))
    }
  }
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 */
