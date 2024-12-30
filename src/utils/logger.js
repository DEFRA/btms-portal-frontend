import { pino } from 'pino'

import { loggerOptions } from '~/src/config/logger-options.js'

export function createLogger () {
  return pino(loggerOptions)
}
