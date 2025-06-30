import { ecsFormat } from '@elastic/ecs-pino-format'
import { getTraceId } from '@defra/hapi-tracing'
import { config } from './config.js'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

/**
 * @type {{ecs: Omit<LoggerOptions, "mixin"|"transport">, "pino-pretty": LoggerOptions}}
 */
const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  'pino-pretty': {
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
        colorize: true
      }
    }
  }
}

/**
 * @satisfies {Options}
 */
export const loggerOptions = {
  enabled: logConfig.enabled,
  ignorePaths: ['/health'],
  ignoreTags: ['assets'],
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin () {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}

/**
 * @import { Options } from 'hapi-pino'
 * @import { LoggerOptions } from 'pino'
 */
