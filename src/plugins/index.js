import { vision } from './template-renderer/vision.js'
import { requestLogger } from './request-logger.js'
import { secureContext } from './secure-context/secure-context.js'
import { sessionManager } from './session-manager.js'
import { defraId } from './auth/defra-id.js'
import { sessionCookie } from './auth/session-cookie.js'
import { requestTracing } from './request-tracing.js'
import { router } from './router.js'
import { pulse } from './pulse.js'
import { errorPage } from './error-page.js'
import { wreckProxyConfiguration } from './wreck-proxy-configuration.js'

export default [
  requestLogger,
  requestTracing,
  secureContext,
  pulse,
  sessionManager,
  wreckProxyConfiguration,
  defraId,
  sessionCookie,
  vision,
  router,
  errorPage
]
