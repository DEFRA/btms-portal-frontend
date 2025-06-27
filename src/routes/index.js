import { health } from './health.js'
import { staticAssetRoutes } from './static-assets.js'
import { home } from './home.js'

const defaultRoutes = [
  health,
  home,
  ...staticAssetRoutes
]

export default defaultRoutes
