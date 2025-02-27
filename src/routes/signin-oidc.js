import { v4 as uuidv4 } from 'uuid'
import { addSeconds } from 'date-fns'
import { paths } from './route-constants.js'

export const signinOidc = {
  method: ['GET', 'POST'],
  path: paths.AUTH,
  options: {
    auth: 'defra-id'
  },
  handler: async (_request, h) => {
    if (_request.auth.isAuthenticated) {
      const { profile } = _request.auth.credentials
      const expiresInSeconds = _request.auth.credentials.expiresIn
      const expiresInMilliSeconds = expiresInSeconds * 1000
      const expiresAt = addSeconds(new Date(), expiresInSeconds)

      const sessionId = uuidv4()
      await _request.server.app.cache.set(sessionId, {
        ...profile,
        isAuthenticated: _request.auth.isAuthenticated,
        token: _request.auth.credentials.token,
        refreshToken: _request.auth.credentials.refreshToken,
        expiresIn: expiresInMilliSeconds,
        expiresAt: expiresAt.toISOString()
      })

      _request.cookieAuth.set({ sessionId })

      _request.logger.info('User has been successfully authenticated')
    }

    const redirect = _request.yar.flash('referrer')?.at(0) ?? '/search'

    return h.redirect(redirect)
  }
}
