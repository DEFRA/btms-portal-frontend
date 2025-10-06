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

const accountManagementUrl = config.get('auth.defraId.accountManagementUrl')
const manageAccountLink = {
  text: 'Manage account',
  href: accountManagementUrl
}
const signOutLink = {
  text: 'Sign out',
  href: paths.SIGN_OUT
}

/**
 * @param {Request} request
 */
export async function context(request) {
  const manifest = getManifest()
  const assetPath = config.get('assetPath')
  const serviceName = config.get('serviceName')

  const authedUser = await getUserSession(request)

  return {
    assetPath: `${assetPath}/assets`,
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName
    },
    ...(authedUser?.strategy === 'defraId' && { manageAccountLink }),
    ...(authedUser?.isAuthenticated && { signOutLink }),

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
