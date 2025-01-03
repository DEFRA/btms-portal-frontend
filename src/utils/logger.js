import { pino } from 'pino'

import { loggerOptions } from '../config/logger-options.js'

export function createLogger () {
  return pino(loggerOptions)
}
