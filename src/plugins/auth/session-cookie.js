import authCookie from '@hapi/cookie'
import { isPast, parseISO, subMinutes } from 'date-fns'

import { config } from '../../config/config.js'
import { refreshAccessToken } from './refesh-token.js'
import { removeUserSession, updateUserSession } from './user-session.js'

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
          ttl: sessionConfig.cookie.ttl
        },
        keepAlive: true,
        validate: async (request, session) => {
          const authedUser = await request.getUserSession()

          if (!authedUser) {
            return { isValid: false }
          }

          const tokenHasExpired = isPast(
            subMinutes(parseISO(authedUser.expiresAt), 1)
          )

          if (tokenHasExpired) {
            const response = await refreshAccessToken(request)
            const refreshAccessTokenJson = await response.json()

            if (!response.ok) {
              removeUserSession(request)

              return { isValid: false }
            }

            const updatedSession = await updateUserSession(
              request,
              refreshAccessTokenJson
            )

            return {
              isValid: true,
              credentials: updatedSession
            }
          }

          const userSession = await server.app.cache.get(session.sessionId)

          if (userSession) {
            return {
              isValid: true,
              credentials: userSession
            }
          }

          return { isValid: false }
        }
      })

      server.auth.default('session')
    }
  }
}

export { sessionCookie }
