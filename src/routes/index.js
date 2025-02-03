import { health } from './health.js'
import { staticAssetRoutes } from './static-assets.js'
import { home } from './home.js'
import { search } from './search.js'
import { searchResult } from './search-result.js'

const defaultRoutes = [
  health,
  home,
  ...staticAssetRoutes
]

const appSpecificRoutes = [
  ...search,
  searchResult
]

export default defaultRoutes.concat(appSpecificRoutes)
