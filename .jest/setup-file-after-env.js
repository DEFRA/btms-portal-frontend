import '@testing-library/jest-dom'
import globalJsdom from 'global-jsdom'

const cleanup = globalJsdom()

beforeEach(() => {
  cleanup()
  global.window = global.window || {}
  global.window.navigator = global.window.navigator || {}
})

// Globally mock redis in tests
jest.mock('ioredis')
