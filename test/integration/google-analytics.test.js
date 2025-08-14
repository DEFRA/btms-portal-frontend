import globalJsdom from 'global-jsdom'
import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'
import { config } from '../../src/config/config.js'

const gtmId = config.get('gtmId')

test('when analytics accepted, google tag manager is present', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING,
    headers: {
      cookie: 'cookiePolicy=' + Buffer.from('{"analytics":"yes"}').toString('base64')
    }
  })

  globalJsdom(payload)

  expect(document.querySelector(`script[data-id='${gtmId}']`))
    .toBeInTheDocument()
  expect(document.querySelector(`noscript[data-id='${gtmId}']`))
    .toBeInTheDocument()
})

test('when analytics not accepted, google tag manager is not present', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.LANDING,
    headers: {
      cookie: 'cookiePolicy=' + Buffer.from('{"analytics":"no"}').toString('base64')
    }
  })

  globalJsdom(payload)

  expect(document.querySelector(`script[data-id='${gtmId}']`))
    .not.toBeInTheDocument()
  expect(document.querySelector(`noscript[data-id='${gtmId}']`))
    .not.toBeInTheDocument()
})
