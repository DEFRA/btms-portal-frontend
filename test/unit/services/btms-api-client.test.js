import Wreck from '@hapi/wreck'
import { deserialise } from 'kitsu-core'
import {
  getCustomsDeclarationByMovementRefNum,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationsByChedRefs,
  getPreNotificationByChedRef,
  getPreNotificationByPartialChedRef
} from '../../../src/services/btms-api-client.js'

const mockLogError = jest.fn()
jest.mock('../../../src/utils/logger.js', () => ({
  createLogger: () => ({
    error: (...args) => mockLogError(...args)
  })
}))
jest.mock('@hapi/wreck', () => ({
  defaults: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn()
  })
}))

jest.mock('kitsu-core', () => ({
  deserialise: jest.fn()
}))

describe('btms-api-client', () => {
  const testMrn = 'mrn1'
  const anotherTestMrn = 'mrn2'
  const testChedRef = 'ched1'
  const anotherTestChedRef = 'ched2'

  describe('data retrieval', () => {
    const testApiResponse = { data: 'test api data' }

    const makeAssertions = (result, expectedApiInvocationEndpoint) => {
      expect(result).toEqual(testApiResponse)
      expect(deserialise).toHaveBeenCalledWith(testApiResponse)
      expect(Wreck.defaults({}).get).toHaveBeenCalledWith(
        `https://btms-api-base-url-for-unit-tests/api${expectedApiInvocationEndpoint}`,
        {
          headers: { Authorization: 'Basic dXNyLW5hbWUtZm9yLXVuaXQtdGVzdHM6cHdkLWZvci11bml0LXRlc3Rz' },
          json: 'strict'
        })
    }

    beforeAll(() => {
      Wreck.defaults({}).get.mockResolvedValue({ payload: testApiResponse })
      deserialise.mockReturnValue(testApiResponse)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('should retrieve customs declaration by MRN successfully', async () => {
      const result = await getCustomsDeclarationByMovementRefNum(testMrn)

      makeAssertions(result, `/movements/${testMrn}`)
    })

    test('should retrieve multiple customs declarations successfully', async () => {
      const result = await getCustomsDeclarationsByMovementRefNums([testMrn, anotherTestMrn])

      makeAssertions(result, `/movements?filter=any(id,%27${testMrn}%27,%27${anotherTestMrn}%27)`)
    })

    test('should retrieve pre-notification by CHED ref successfully', async () => {
      const result = await getPreNotificationByChedRef(testChedRef)

      makeAssertions(result, `/import-notifications/${testChedRef}`)
    })

    test('should retrieve pre-notification by partial CHED ref successfully', async () => {
      const result = await getPreNotificationByPartialChedRef(testChedRef)

      makeAssertions(result, `/import-notifications?filter=endsWith(id,%27${testChedRef}%27)`)
    })

    test('should retrieve multiple pre-notifications successfully', async () => {
      const result = await getPreNotificationsByChedRefs([testChedRef, anotherTestChedRef])

      makeAssertions(result, `/import-notifications?filter=any(id,%27${testChedRef}%27,%27${anotherTestChedRef}%27)`)
    })
  })

  describe('error handling', () => {
    const testError = new Error('Test data retrieval error')
    const makeAssertions = (actualResult) => {
      expect(actualResult).toBeNull()
      expect(mockLogError).toHaveBeenCalledWith(testError)
    }

    beforeAll(() => {
      Wreck.defaults({}).get.mockRejectedValue(testError)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('should handle errors when retrieving a customs declaration by MRN', async () => {
      const result = await getCustomsDeclarationByMovementRefNum(testMrn)

      makeAssertions(result)
    })

    test('should handle errors when retrieving multiple customs declarations', async () => {
      const result = await getCustomsDeclarationsByMovementRefNums([testMrn, anotherTestMrn])

      makeAssertions(result)
    })

    test('should handle errors when retrieving a pre-notification by CHED reference', async () => {
      const result = await getPreNotificationByChedRef(testChedRef)

      makeAssertions(result)
    })

    test('should handle errors when retrieving a pre-notification by partial CHED reference', async () => {
      const result = await getPreNotificationByPartialChedRef(testChedRef)

      makeAssertions(result)
    })

    test('should handle errors when retrieving multiple pre-notifications', async () => {
      const result = await getPreNotificationsByChedRefs([testChedRef, anotherTestChedRef])

      makeAssertions(result)
    })
  })
})
