import { initialiseServer } from '../utils/initialise-server.js'
import { paths } from '../../src/routes/route-constants.js'
import globalJsdom from 'global-jsdom'

test('when analytics accepted, google tag manager is present', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":true}').toString('base64')
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  const gtmScript = [...document.getElementsByTagName('script')].find(s => s.innerHTML.includes('gtm'))
  expect(gtmScript).not.toBeUndefined()
})

test('when analytics not accepted, google tag manager is not present', async () => {
  const server = await initialiseServer()

  const { payload } = await server.inject({
    headers: {
      Cookie: 'cookie_policy=' + Buffer.from('{"analytics":false}').toString('base64')
    },
    method: 'get',
    url: paths.LANDING
  })

  globalJsdom(payload)

  const gtmScript = [...document.getElementsByTagName('script')].find(s => s.innerHTML.includes('gtm'))
  expect(gtmScript).toBeUndefined()
})
