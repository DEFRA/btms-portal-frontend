import { createServer } from '../../src/server'

export async function initialiseServer (state) {
  const server = await createServer()

  if (state) {
    await server.ext('onPreAuth', (request, h) => {
      request.yar.flash(state.type, state.message)
      return h.continue
    })
  }

  await server.initialize()

  server.ext('onPostResponse', async () => {
    await server.stop()
  })

  return server
}
