import { CACHE_CONTROL_NO_STORE, paths } from './route-constants.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { getConfig } from '../services/decision-deriver-client.js'
import { config } from '../config/config.js'
import { prettyPrint } from '../models/format.js'
import { createLogger } from '../utils/logger.js'

const ADMIN_ENVIRONMENT_CONFIG_TEMPLATE = 'admin-environment-config'
const flagsList = [
  { flagName: 'SHOW_TRACES_CHEDS', flagConfig: 'isTracesChedsEnabled' },
  { flagName: 'SHOW_QUANTITY_STATUS', flagConfig: 'isQuantityStatusEnabled' }
]
const FLAG_STATUS_BADGE = {
  ON: 'ON',
  OFF: 'OFF'
}

const logger = createLogger()

export const adminEnvironmentConfig = {
  method: ['get'],
  path: paths.ADMIN_ENVIRONMENT_CONFIG,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE
  },
  handler: async (request, h) => {
    const frontendFlags = flagsList.map(({ flagName, flagConfig }) => {
      const flagStatus = config.get(flagConfig)

      return {
        flagName,
        status: flagStatus ? FLAG_STATUS_BADGE.ON : FLAG_STATUS_BADGE.OFF
      }
    })

    let decisionDeriverConfig
    try {
      decisionDeriverConfig = await getConfig()
    } catch (err) {
      logger.error(err)
    }

    const viewModel = {
      frontendFlags,
      decisionDeriverConfig: decisionDeriverConfig ? prettyPrint(decisionDeriverConfig) : null
    }

    return h.view(ADMIN_ENVIRONMENT_CONFIG_TEMPLATE, viewModel)
  }
}
