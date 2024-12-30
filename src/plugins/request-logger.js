import hapiPino from 'hapi-pino'

import { loggerOptions } from '~/src/config/logger-options.js'

/**
 * @satisfies {ServerRegisterPluginObject<Options>}
 */
export const requestLogger = {
  plugin: hapiPino,
  options: loggerOptions
}

/**
 * @import { ServerRegisterPluginObject } from '@hapi/hapi'
 * @import { Options } from 'hapi-pino'
 */
