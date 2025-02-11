import {
  getPreNotificationByChedRef,
  getCustomsDeclarationByMovementRefNum,
  getPreNotificationsByChedRefs,
  getCustomsDeclarationsByMovementRefNums
} from '../../../src/services/btms-api-client.js'
import { performSearch } from '../../../src/services/index.js'
import { searchTypes } from '../../../src/services/search-constants.js'

jest.mock('../../../src/services/btms-api-client.js')

describe('search-service', () => {
  const testMrn = '24GBABCDQR9DEF0AR7'
  const testChedRef = 'CHEDD.GB.2024.1234567'
  const testCustomsDeclaration = { id: testMrn, notifications: { data: [{ id: testChedRef }] } }
  const testPreNotification = { id: testChedRef, movements: { data: [{ id: testMrn }] } }
  const searchByMovementRefNumResult = { data: testCustomsDeclaration }
  const searchByMovementRefsNumResult = { data: [testCustomsDeclaration] }
  const searchByChedRefsResult = { data: [testPreNotification] }
  const searchByChedRefResult = { data: testPreNotification }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('performSearch', () => {
    test('should return customs declaration and related pre-notifications for a valid MRN', async () => {
      getCustomsDeclarationByMovementRefNum.mockReturnValue(searchByMovementRefNumResult)
      getPreNotificationsByChedRefs.mockReturnValue(searchByChedRefsResult)

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
})
