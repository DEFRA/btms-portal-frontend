import '@testing-library/jest-dom'
import globalJsdom from 'global-jsdom'
import wreck from '@hapi/wreck'

const cleanup = globalJsdom()

beforeEach(() => {
  cleanup()
  global.window = global.window || {}
  global.window.navigator = global.window.navigator || {}
})

// Globally mock redis in tests
jest.mock('ioredis')

// This stubs out the discovery endpoints when the tests run
// It was observed that the tests were making a call to this endpoint for every test
// These are overriden by the tests if they themselves stub out the endpoints
const OIDC_DISCOVERY = {
  issuer: 'https://dcidmtest.b2clogin.com/131a35fb-0422-49c9-8753-15217cec5411/',
  authorization_endpoint:
    'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/oauth2/authorize',
  token_endpoint:
    'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/oauth2/token',
  end_session_endpoint:
    'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/oauth2/logout',
  jwks_uri:
    'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/discovery/keys'
}

const realGet = wreck.get
wreck.get = (url, options) =>
  url.includes('/.well-known/openid-configuration')
    ? Promise.resolve({ payload: OIDC_DISCOVERY })
    : realGet(url, options)
