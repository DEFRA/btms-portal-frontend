import { health } from './health.js'
import { staticAssetRoutes } from './static-assets.js'
import { home } from './home.js'
import { signinOidc } from './signin-oidc.js'
import { signIn } from './sign-in.js'
import { signOut } from './sign-out.js'
import { search } from './search.js'
import { searchResult } from './search-result.js'

const defaultRoutes = [
  health,
  home,
  ...staticAssetRoutes
]

const appSpecificRoutes = [
  signinOidc,
  signIn,
  signOut,
  ...search,
  searchResult
]

export default defaultRoutes.concat(appSpecificRoutes)
