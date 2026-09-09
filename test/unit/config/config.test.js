import { config } from '../../../src/config/config.js'

describe('#config - feature flags', () => {
  afterEach(() => {
    config.set('isTracesChedsEnabled', false)
  })

  test('Should have TRACES CHEDs flag disabled by default', () => {
    expect(config.get('isTracesChedsEnabled')).toBe(false)
  })

  test('Should allow TRACES CHEDs flag to be enabled', () => {
    config.set('isTracesChedsEnabled', true)

    expect(config.get('isTracesChedsEnabled')).toBe(true)
  })
})
