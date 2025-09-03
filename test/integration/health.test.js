import { paths } from '../../src/routes/route-constants.js'
import { initialiseServer } from '../utils/initialise-server.js'

test('returns status', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.HEALTH
  })

  expect(JSON.parse(payload)).toEqual({ message: 'success' })
})
