import '@testing-library/jest-dom'
import globalJsdom from 'global-jsdom'

const cleanup = globalJsdom()
beforeEach(cleanup)

// Globally mock redis in tests
jest.mock('ioredis')
