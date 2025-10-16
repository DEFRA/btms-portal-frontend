import { accessibility } from './accessibility.js'
import { health } from './health.js'
import { staticAssetRoutes } from './static-assets.js'
import { home } from './home.js'
import { latestActivity } from './latest-activity.js'
import { reporting } from './reporting.js'
import { reportingCsv } from './reporting.csv.js'
import { signinOidc } from './signin-oidc.js'
import { signIn } from './sign-in.js'
import { signInChoose } from './sign-in-choose.js'
import { signinOidcEntra } from './signin-oidc-entra.js'
import { signInEntra } from './sign-in-entra.js'
import { signOut } from './sign-out.js'
import { signedOut } from './signed-out.js'
import { search } from './search.js'
import { searchResult } from './search-result.js'
import { chromeDevtools } from './chrome-devtools.js'
import { cookiesGet, cookiesPost } from './cookies.js'

export default [
  accessibility,
  cookiesGet,
  cookiesPost,
  chromeDevtools,
  health,
  home,
  latestActivity,
  reporting,
  reportingCsv,
  signIn,
  ...signInChoose,
  signInEntra,
  signinOidc,
  signinOidcEntra,
  signedOut,
  signOut,
  search,
  searchResult,
  ...staticAssetRoutes
]
