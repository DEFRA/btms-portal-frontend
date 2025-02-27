import { health } from './health.js'
import { staticAssetRoutes } from './static-assets.js'
import { home } from './home.js'
import { signinOidc } from './signin-oidc.js'
import { login } from './login.js'
import { logout } from './logout.js'
import { search } from './search.js'
import { searchResult } from './search-result.js'

const defaultRoutes = [
  health,
  home,
  ...staticAssetRoutes
]

const appSpecificRoutes = [
  signinOidc,
  login,
  logout,
  ...search,
  searchResult
]

export default defaultRoutes.concat(appSpecificRoutes)
