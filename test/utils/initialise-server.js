import { createServer } from '../../src/server'

export async function initialiseServer () {
  const server = await createServer()
  await server.initialize()

  server.ext('onPostResponse', async () => {
    await server.stop()
  })

  return server
}
