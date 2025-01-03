import { constants as httpConstants } from 'http2'
import { config } from '../config/config.js'

export const staticAssetRoutes = [
  {
    options: {
      auth: false,
      cache: {
        expiresIn: config.get('staticCacheTimeout'),
        privacy: 'private'
      }
    },
    method: 'GET',
    path: '/favicon.ico',
    handler (_request, h) {
      return h
        .response()
        .code(httpConstants.HTTP_STATUS_NO_CONTENT)
        .type('image/x-icon')
    }
  },
  {
    options: {
      auth: false,
      cache: {
        expiresIn: config.get('staticCacheTimeout'),
        privacy: 'private'
      }
    },
    method: 'GET',
    path: `${config.get('assetPath')}/{param*}`,
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true
      }
    }
  }
]
