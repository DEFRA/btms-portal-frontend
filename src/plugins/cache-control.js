export const cacheControl = {
  plugin: {
    name: 'headers',
    register: (server) => {
      server.ext('onPreResponse', (request, h) => {
        let cacheControlHeader = 'no-store, no-cache, must-revalidate, max-age=0'

        if (request?.path?.includes('/public/')) {
          cacheControlHeader = 'max-age=31536000'
        }

        request?.response?.header('Cache-Control', cacheControlHeader)

        return h.continue
      })
    }
  }
}
