import { createCustomsDeclarationModel } from '../../../src/models/customs-declaration-model.js'
import { createPreNotificationModel } from '../../../src/models/pre-notification-model.js'
import { createSearchResultsModel } from '../../../src/models/index.js'

jest.mock('../../../src/models/customs-declaration-model.js', () => ({
  createCustomsDeclarationModel: jest.fn()
}))
jest.mock('../../../src/models/pre-notification-model.js', () => ({
  createPreNotificationModel: jest.fn()
}))

describe('#createSearchResultsModel', () => {
  test('Should return search results model with the correct structure', () => {
    const testPreNotification = { id: 'CHEDD.GB.2024.1234567' }
    const testPreNotificationModel = { chedRef: 'CHEDD.GB.2024.1234567' }
    const testDocumentCode = 'N852'
    const testCustomsDeclaration = {
      id: '24GBD46UUIIVQABCD1',
      items: [
        {
          documents: [
            { documentReference: 'CHEDGB.2024.1234567', documentCode: testDocumentCode }
          ]
        }
      ]
    }
    const testCustomsDeclarationModel = { mrn: '24GBD46UUIIVQABCD1' }
    const testSearchResult = {
      searchTerm: testCustomsDeclaration.id,
      searchType: 'customs-declaration',
      customsDeclarations: [testCustomsDeclaration],
      preNotifications: [testPreNotification]
    }
    createCustomsDeclarationModel.mockReturnValue(testCustomsDeclarationModel)
    createPreNotificationModel.mockReturnValue(testPreNotificationModel)

    const searchResultsModel = createSearchResultsModel(testSearchResult)

    expect(createCustomsDeclarationModel).toHaveBeenCalledWith(testCustomsDeclaration)
    expect(createPreNotificationModel).toHaveBeenCalledWith(testPreNotification, [testDocumentCode])
    expect(searchResultsModel).toEqual({
      searchTerm: testSearchResult.searchTerm,
      searchType: testSearchResult.searchType,
      customsDeclarations: [testCustomsDeclarationModel],
      preNotifications: [testPreNotificationModel]
    })
  })
})
