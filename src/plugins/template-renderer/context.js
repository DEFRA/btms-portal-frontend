import path from 'node:path'
import { readFileSync } from 'node:fs'
import { config } from '../../config/config.js'
import { getUserSession } from '../../auth/user-session.js'
import { paths } from '../../routes/route-constants.js'
import { APP_SCOPES, AUTH_PROVIDERS } from '../../auth/auth-constants.js'

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

const getNavigation = (pathname, isAdminUser) => {
  const commonNavigationItems = [
    {
      href: paths.SEARCH,
      text: 'Search',
      active: pathname === paths.SEARCH
    },
    {
      href: paths.REPORTING,
      text: 'Reporting',
      active: pathname === paths.REPORTING
    },
    {
      href: paths.LATEST_ACTIVITY,
      text: 'Latest activity',
      active: pathname === paths.LATEST_ACTIVITY
    }
  ]

  return isAdminUser
    ? commonNavigationItems.concat({
      href: paths.ADMIN_SEARCH,
      text: 'Admin',
      active: pathname === paths.ADMIN_SEARCH
    })
    : commonNavigationItems
}

/**
 * @param {Request} request
 */
export async function context(request) {
  const manifest = getManifest()
  const assetPath = config.get('assetPath')
  const serviceName = config.get('serviceName')

  const authedUser = await getUserSession(request)
  const accountNavigation = [
    authedUser?.provider === AUTH_PROVIDERS.DEFRA_ID && manageAccountLink,
    request.auth?.isAuthenticated && signOutLink
  ].filter(Boolean)
  const isAdminUser = authedUser?.scope?.includes(APP_SCOPES.ADMIN)

  const navigation = getNavigation(request.url.pathname, isAdminUser)

  return {
    assetPath: `${assetPath}/assets`,
    defaultHeaderOptions: {
      homepageUrl: 'https://www.gov.uk',
      serviceName
    },
    navigation,
    accountNavigation,
    /**
     * @param {string} asset
     */
    getAssetPath: (asset) => {
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
