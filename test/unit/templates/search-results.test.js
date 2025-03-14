import { renderTemplate } from './template.test.helper.js'
import { searchTypes } from '../../../src/services/search-constants.js'

function createViewContext (documents, isMatched, unmatchedDocRefs) {
  return {
    searchTerm: 'mrn-reference',
    searchType: searchTypes.CUSTOMS_DECLARATION,
    preNotifications: [],
    customsDeclarations: [{
      movementReferenceNumber: '24GBDX8QQ4WWFZNAR3',
      customsDeclarationStatus: 'Hold',
      lastUpdated: '2025-01-01 09:00:00',
      commodities: [
        {
          itemNumber: 1,
          commodityCode: 302499000,
          commodityDesc: 'CHILLI PEPPERS',
          weightOrQuantity: 3471,
          documents,
          matchStatus: {
            isMatched,
            unmatchedDocRefs
          },
          decisions: ['Hold - Awaiting Decision (PHA-FNAO)']
        }
      ]
    }]
  }
}

describe('Search Results', () => {
  let $renderedTemplate

  describe('With MRNs matched to CHEDs', () => {
    test('Should render CHED references and Match status without error highlighting', () => {
      const viewContext = createViewContext(['GBCHD2024.5286242'], true, [])

      $renderedTemplate = renderTemplate('search-results.njk', viewContext)

      expect($renderedTemplate.html()).not.toContain('class="error"')
      expect($renderedTemplate.html()).toContain('<li>GBCHD2024.5286242</li>')
      expect($renderedTemplate.html()).toContain('<strong class="govuk-tag govuk-tag--green">')
      expect($renderedTemplate.html()).not.toContain('class="govuk-tag govuk-tag--red')
      expect($renderedTemplate.html()).not.toContain('<span class="tooltip" role="tooltip">')
    })
  })

  describe('With MRNs not matched to CHEDs', () => {
    test('Should render CHED references and Match status with error highlighting', () => {
      const viewContext = createViewContext(['GBCHD2024.5286242', 'GBCHD2024.5313986'], false, ['GBCHD2024.5286242'])

      $renderedTemplate = renderTemplate('search-results.njk', viewContext)

      expect($renderedTemplate.html()).toContain('<li class="app-import-commodities__ched-ref--unmatched">GBCHD2024.5286242</li>')
      expect($renderedTemplate.html()).toContain('<li>GBCHD2024.5313986</li>')
      expect($renderedTemplate.html()).toContain('<strong class="govuk-tag govuk-tag--red app-import-commodities__match--no">')
      expect($renderedTemplate.html()).toContain('<p class="app-import-commodities__match--no-tooltip" role="tooltip">')
    })
  })
})
