import { config } from '../../../src/config/config.js'

describe('#config - feature flags', () => {
  afterEach(() => {
    config.set('isTracesChedsEnabled', false)
    config.set('isQuantityStatusEnabled', false)
  })

  test('Should have TRACES CHEDs flag disabled by default', () => {
    expect(config.get('isTracesChedsEnabled')).toBe(false)
  })

  test('Should allow TRACES CHEDs flag to be enabled', () => {
    config.set('isTracesChedsEnabled', true)

    expect(config.get('isTracesChedsEnabled')).toBe(true)
  })

  test('Should have quantity status flag disabled by default', () => {
    expect(config.get('isQuantityStatusEnabled')).toBe(false)
  })

  test('Should allow quantity status flag to be enabled', () => {
    config.set('isQuantityStatusEnabled', true)

    expect(config.get('isQuantityStatusEnabled')).toBe(true)
  })
})
