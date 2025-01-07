import { vision } from './template-renderer/vision.js'
import { requestLogger } from './request-logger.js'
import { secureContext } from './secure-context/secure-context.js'
import { sessionManager } from './session-manager.js'
import { requestTracing } from './request-tracing.js'
import { router } from './router.js'
import { pulse } from './pulse.js'

export const plugins = [
  requestLogger,
  requestTracing,
  secureContext,
  pulse,
  sessionManager,
  vision,
  router
]
