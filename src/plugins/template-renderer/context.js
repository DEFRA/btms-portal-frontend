import path from 'node:path'
import { readFileSync } from 'node:fs'
import { config } from '../../config/config.js'
import { getUserSession } from '../../auth/user-session.js'
import { paths } from '../../routes/route-constants.js'

let webpackManifest
// once we move to Eslint 9.19+ we can use import with { type: json }
const getManifest = () => {
  if (!webpackManifest) {
    const manifestPath = path.resolve(
      config.get('root'),
      '.public/assets-manifest.json'
    )
    webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  }
  return webpackManifest
}

/**
 * @param {Request} request
 */
export async function context(request) {
  const manifest = getManifest()
  const assetPath = config.get('assetPath')
  const serviceName = config.get('serviceName')

  const authedUser = await getUserSession(request)

  const navigation = []

  if (authedUser?.strategy === 'defraId') {
    const accountManagementUrl = config.get('auth.defraId.accountManagementUrl')
    navigation.push({
      text: 'Manage account',
      href: accountManagementUrl
    })
  }
  if (authedUser?.isAuthenticated) {
    navigation.push({
      text: 'Sign out',
      href: `${paths.SIGN_OUT}?provider=${authedUser.strategy}`
    })
  }

  return {
    assetPath: `${assetPath}/assets`,
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName,
      navigation
    },

    /**
     * @param {string} asset
     */
    getAssetPath(asset) {
      const hashed = manifest[asset]
      if (!hashed) {
        request.logger.error(`Asset ${asset} not found in manifest`)
      }
      return `${assetPath}/${hashed}`
    }
  }
}

/**
 * @import { Request } from '@hapi/hapi'
 */
