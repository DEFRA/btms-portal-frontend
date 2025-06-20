import path from 'node:path'
import { readFileSync } from 'node:fs'
import { config } from '../../config/config.js'
import { createLogger } from '../../utils/logger.js'
import { getUserSession } from '../../auth/user-session.js'
import { paths } from '../../routes/route-constants.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

/** @type {Record<string, string> | undefined} */
let webpackManifest

/**
 * @param {Request | null} request
 */
export async function context (request) {
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const authedUser = await getUserSession(request)

  return {
    authedUser,
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    signOutUrl: paths.SIGN_OUT,

    /**
     * @param {string} asset
     */
    getAssetPath (asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}

/**
 * @import { Request } from '@hapi/hapi'
 */
