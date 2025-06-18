import { vision } from './template-renderer/vision.js'
import { requestLogger } from './request-logger.js'
import { secureContext } from './secure-context/secure-context.js'
import { sessionManager } from './session-manager.js'
import { openId } from './auth/open-id.js'
import { sessionCookie } from './auth/session-cookie.js'
import { requestTracing } from './request-tracing.js'
import { router } from './router.js'
import { pulse } from './pulse.js'
import { errorPage } from './error-page.js'
import { wreckProxyConfiguration } from './wreck-proxy-configuration.js'
import { securityHeaders } from './security-headers.js'

export default [
  requestLogger,
  requestTracing,
  secureContext,
  pulse,
  sessionManager,
  wreckProxyConfiguration,
  openId,
  sessionCookie,
  vision,
  router,
  errorPage,
  securityHeaders
]
