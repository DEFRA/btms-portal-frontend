import { loggerOptions } from '../../../src/config/logger-options.js'
import { getTraceId } from '@defra/hapi-tracing'

jest.mock('@defra/hapi-tracing', () => ({
  getTraceId: jest.fn()
}))

describe('#loggerOptions', () => {
  test('mixin should return empty object when the retrieved tracedId is not truthy', () => {
    getTraceId.mockReturnValue(null)
    const mixinOutput = loggerOptions.mixin()
    expect(mixinOutput).toEqual({})
  })

  test('mixin should return object with traceId when the retrieved traceId is truthy', () => {
    const traceId = 'test-trace-id'
    getTraceId.mockReturnValue(traceId)
    const mixinOutput = loggerOptions.mixin()
    expect(mixinOutput).toEqual({ trace: { id: traceId } })
  })
})
