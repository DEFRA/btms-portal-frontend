import authCookie from '@hapi/cookie'

import { config } from '../../config/config.js'
import { validateUserSession } from '../../auth/user-session.js'

const sessionConfig = config.get('session')

const sessionCookie = {
  plugin: {
    name: 'user-session',
    register: async (server) => {
      await server.register(authCookie)

      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'userSession',
          path: '/',
          password: sessionConfig.cookie.password,
          isSecure: sessionConfig.cookie.secure,
          isSameSite: false,
          ttl: sessionConfig.cookie.ttl
        },
        keepAlive: true,
        validate: async (request, session) => {
          return validateUserSession(server, request, session)
        }
      })

      server.auth.default('session')
    }
  }
}

export { sessionCookie }
