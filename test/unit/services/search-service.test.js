import {
  getPreNotificationByChedRef,
  getCustomsDeclarationByMovementRefNum,
  getPreNotificationsByChedRefs,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationByPartialChedRef
} from '../../../src/services/btms-api-client.js'
import { performSearch, isValidSearchTerm, hasSearchResult } from '../../../src/services/index.js'
import { searchTypes } from '../../../src/services/search-constants.js'

jest.mock('../../../src/services/btms-api-client.js')

describe('search-service', () => {
  const testMrn = '24GBABCDQR9DEF0AR7'
  const testChedRef = 'CHEDD.GB.2024.1234567'
  const testCustomsDeclaration = { id: testMrn, notifications: { data: [{ id: testChedRef }] } }
  const testPreNotification = { id: testChedRef, movements: { data: [{ id: testMrn }] } }
  const searchByMovementRefsNumResult = { data: [testCustomsDeclaration] }
  const searchByChedRefResult = { data: testPreNotification }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('performSearch', () => {
    test('should return customs declaration and related pre-notifications for a valid MRN', async () => {
      getCustomsDeclarationByMovementRefNum.mockReturnValue({ data: testCustomsDeclaration })
      getPreNotificationsByChedRefs.mockReturnValue({ data: [testPreNotification] })

      const result = await performSearch(testMrn)

      expect(result).toEqual({
        searchTerm: testMrn,
        searchType: searchTypes.CUSTOMS_DECLARATION,
        customsDeclarations: [testCustomsDeclaration],
        preNotifications: [testPreNotification]
      })
      expect(getCustomsDeclarationByMovementRefNum).toHaveBeenCalledWith(testMrn)
      expect(getPreNotificationsByChedRefs).toHaveBeenCalledWith([testChedRef])
    })

    test('should return pre-notification and related customs declarations for a valid CHED reference', async () => {
      getPreNotificationByChedRef.mockReturnValue(searchByChedRefResult)
      getCustomsDeclarationsByMovementRefNums.mockReturnValue(searchByMovementRefsNumResult)

      const result = await performSearch(testChedRef)

      expect(result).toEqual({
        searchTerm: testChedRef,
        searchType: searchTypes.PRE_NOTIFICATION,
        customsDeclarations: [testCustomsDeclaration],
        preNotifications: [testPreNotification]
      })
      expect(getPreNotificationByChedRef).toHaveBeenCalledWith(testChedRef)
      expect(getCustomsDeclarationsByMovementRefNums).toHaveBeenCalledWith([testMrn])
    })

    test('should return pre-notification only for a valid CHED reference when there are no related customs declarations', async () => {
      const testPreNotificationWithoutMovements = { id: testChedRef, movements: { data: [] } }
      getPreNotificationByChedRef.mockReturnValue({ data: testPreNotificationWithoutMovements })

      const result = await performSearch(testChedRef)

      expect(result).toEqual({
        searchTerm: testChedRef,
        searchType: searchTypes.PRE_NOTIFICATION,
        customsDeclarations: [],
        preNotifications: [testPreNotificationWithoutMovements]
      })
      expect(getPreNotificationByChedRef).toHaveBeenCalledWith(testChedRef)
      expect(getCustomsDeclarationsByMovementRefNums).toHaveBeenCalledTimes(0)
    })

    test.each([
      { searchTerm: 'GBCHD2024.1234567', partialChedRef: '2024.1234567' },
      { searchTerm: '2024.1234567' },
      { searchTerm: '1234567' }
    ])('should return pre-notification and related customs declarations for a valid partial/CDS CHED reference', async ({ searchTerm, partialChedRef }) => {
      getPreNotificationByPartialChedRef.mockReturnValue(searchByChedRefResult)
      getCustomsDeclarationsByMovementRefNums.mockReturnValue(searchByMovementRefsNumResult)

      const result = await performSearch(searchTerm)

      expect(result).toEqual({
        searchTerm,
        searchType: searchTypes.PRE_NOTIFICATION_PARTIAL_REF,
        customsDeclarations: [testCustomsDeclaration],
        preNotifications: [testPreNotification]
      })
      expect(getPreNotificationByPartialChedRef).toHaveBeenCalledWith(partialChedRef ?? searchTerm)
      expect(getCustomsDeclarationsByMovementRefNums).toHaveBeenCalledWith([testMrn])
    })

    test('should return empty results for an invalid search term', async () => {
      const invalidSearchTerm = 'INVALID_SEARCH_TERM'

      const result = await performSearch(invalidSearchTerm)

      expect(result).toEqual({
        searchTerm: invalidSearchTerm,
        searchType: null,
        customsDeclarations: [],
        preNotifications: []
      })
      expect(getCustomsDeclarationByMovementRefNum).not.toHaveBeenCalled()
      expect(getPreNotificationByChedRef).not.toHaveBeenCalled()
    })

    test('should handle errors gracefully', async () => {
      getCustomsDeclarationByMovementRefNum.mockReturnValue(null)

      const result = await performSearch(testMrn)

      expect(result).toEqual({
        searchTerm: testMrn,
        searchType: searchTypes.CUSTOMS_DECLARATION,
        customsDeclarations: [],
        preNotifications: []
      })
      expect(getCustomsDeclarationByMovementRefNum).toHaveBeenCalledWith(testMrn)
    })
  })

  describe('isValidSearchTerm', () => {
    test.each([
      { searchTerm: 'CHEDP.GB.2024.4450758', expectedResult: true },
      { searchTerm: 'GBCHD2024.1234567', expectedResult: true },
      { searchTerm: '2024.1234567', expectedResult: true },
      { searchTerm: '1234567', expectedResult: true },
      { searchTerm: '24GB6T3HFCIZV1HAR9', expectedResult: true },
      { searchTerm: '', expectedResult: false },
      { searchTerm: undefined, expectedResult: false },
      { searchTerm: '25GB0P0T2', expectedResult: false }
    ])('$searchTerm should return $expectedResult', async ({ searchTerm, expectedResult }) => {
      const result = await isValidSearchTerm(searchTerm)

      expect(result).toBe(expectedResult)
    })
  })

  describe('hasSearchResult', () => {
    test('should return true if search contains customs declaration', async () => {
      getCustomsDeclarationByMovementRefNum.mockReturnValue(searchByMovementRefsNumResult)
      getPreNotificationsByChedRefs.mockReturnValue(null)

      const result = await hasSearchResult(testMrn)

      expect(result).toBeTruthy()
    })

    test('should return true if search contains pre notification', async () => {
      getPreNotificationByChedRef.mockReturnValue(searchByChedRefResult)
      getCustomsDeclarationsByMovementRefNums.mockReturnValue(null)

      const result = await hasSearchResult(testChedRef)

      expect(result).toBeTruthy()
    })

    test('should return false if search contains no customs declaration or related pre notifications', async () => {
      getCustomsDeclarationByMovementRefNum.mockReturnValue(null)
      getPreNotificationsByChedRefs.mockReturnValue(null)

      const result = await hasSearchResult(testMrn)

      expect(result).toBeFalsy()
    })

    test('should return false if search contains no pre notification or related customs declarations', async () => {
      getPreNotificationByChedRef.mockReturnValue(null)
      getCustomsDeclarationsByMovementRefNums.mockReturnValue(null)

      const result = await hasSearchResult(testChedRef)

      expect(result).toBeFalsy()
    })
  })
})
