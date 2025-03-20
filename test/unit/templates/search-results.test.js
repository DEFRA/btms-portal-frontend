import { renderTemplate } from './template.test.helper.js'
import { searchTypes } from '../../../src/services/search-constants.js'

function createViewContext (documents, isMatched, unmatchedDocRefs, preNotificationCommodityDesc = 'CHILLI PEPPERS', customsDeclarationCommodityDesc = 'CHILLI PEPPERS') {
  return {
    searchTerm: 'mrn-reference',
    searchType: searchTypes.CUSTOMS_DECLARATION,
    preNotifications: [{
      chedRef: 'ched.ref',
      status: 'Validated',
      lastUpdated: '2025-01-01 09:00:00',
      authorities: ['PHA - FNAO'],
      commodities: [
        {
          itemNumber: 12074014,
          commodityCode: '0909',
          commodityDesc: preNotificationCommodityDesc,
          weightOrQuantity: 16120
        }
      ],
      decision: 'Acceptable for internal market'
    }],
    customsDeclarations: [{
      movementReferenceNumber: '24GBDX8QQ4WWFZNAR3',
      customsDeclarationStatus: 'Hold',
      lastUpdated: '2025-01-01 09:00:00',
      commodities: [
        {
          itemNumber: 1,
          commodityCode: '302499000',
          commodityDesc: customsDeclarationCommodityDesc,
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
      expect($renderedTemplate.html()).toContain('<strong class="govuk-tag govuk-tag--green app-import-commodities__match--yes">')
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

  describe('With MRN that has a short description', () => {
    test('Should not render description in tooltip', () => {
      const viewContext = createViewContext(['GBCHD2024.5286242'], true, [], 'A short CHED description', 'A short MRN description')

      $renderedTemplate = renderTemplate('search-results.njk', viewContext)

      expect($renderedTemplate.html()).toContain('A short MRN description')
      expect($renderedTemplate.html()).toContain('A short CHED description')
      expect($renderedTemplate.html()).not.toContain('...')
      expect($renderedTemplate.html()).not.toContain('<div class="app-import-commodities__description--tooltip" role="tooltip">')
    })
  })

  describe('With MRN that has a long description', () => {
    test('Should render truncated description and full description in tooltip', () => {
      const viewContext = createViewContext(['GBCHD2024.5286242'],
        true,
        [],
        'A long CHED description that should be truncated and displayed in full inside a tooltip',
        'A long MRN description that should be truncated and displayed in full inside a tooltip')

      $renderedTemplate = renderTemplate('search-results.njk', viewContext)

      expect($renderedTemplate.html()).toContain('A long MRN description t...')
      expect($renderedTemplate.html()).toContain('A long CHED description that should be truncated a...')
      expect($renderedTemplate.html()).toContain('<div class="app-import-commodities__description--tooltip" role="tooltip">A long MRN description that should be truncated and displayed in full inside a tooltip</div>')
      expect($renderedTemplate.html()).toContain('<div class="app-import-commodities__description--tooltip" role="tooltip">A long CHED description that should be truncated and displayed in full inside a tooltip</div>')
    })
  })
})
