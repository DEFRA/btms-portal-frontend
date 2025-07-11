import { renderTemplate } from './template.test.helper.js'

function createViewContext(
  documents,
  isMatched,
  unmatchedDocRefs,
  preNotificationCommodityDesc = 'CHILLI PEPPERS',
  customsDeclarationCommodityDesc = 'CHILLI PEPPERS'
) {
  return {
    searchTerm: 'mrn-reference',
    preNotifications: [
      {
        referenceNumber: 'ched.ref',
        status: 'Validated',
        updated: '2025-01-01 09:00:00',
        authorities: ['PHA - FNAO'],
        commodities: [
          {
            id: '1',
            itemNumber: 12074014,
            commodityCode: '0909',
            commodityDesc: preNotificationCommodityDesc,
            weightOrQuantity: 16120
          }
        ],
        decision: 'Acceptable for internal market'
      }
    ],
    customsDeclarations: [
      {
        movementReferenceNumber: '24GBDX8QQ4WWFZNAR3',
        declarationUcr: '1GB126344356000-ABC35932Y1ABC',
        status: 'Hold',
        updated: '2025-01-01 09:00:00',
        commodities: [
          {
            id: '2',
            itemNumber: 1,
            taricCommodityCode: '302499000',
            goodsDescription: customsDeclarationCommodityDesc,
            weightOrQuantity: 3471,
            documents,
            matchStatus: {
              isMatched,
              unmatchedDocRefs
            },
            decisions: ['Hold - Awaiting Decision (PHA-FNAO)']
          }
        ]
      }
    ]
  }
}

describe('Search Results', () => {
  let $renderedTemplate

  describe('With MRN that has a short description', () => {
    test('Should not render description in tooltip', () => {
      const viewContext = createViewContext(
        ['GBCHD2024.5286242'],
        true,
        [],
        'A short CHED description',
        'A short MRN description'
      )

      $renderedTemplate = renderTemplate('search-result.njk', viewContext)

      expect($renderedTemplate.html()).toContain('A short MRN description')
      expect($renderedTemplate.html()).toContain('A short CHED description')
      expect($renderedTemplate.html()).not.toContain('...')
      expect($renderedTemplate.html()).not.toContain(
        '<div class="app-import-commodities__description--tooltip" role="tooltip">'
      )
    })
  })

  describe('With MRN that has a long description', () => {
    test('Should render truncated description and full description in tooltip', () => {
      const viewContext = createViewContext(
        ['GBCHD2024.5286242'],
        true,
        [],
        'A long CHED description that should be truncated and displayed in full inside a tooltip',
        'A long MRN description that should be truncated and displayed in full inside a tooltip'
      )

      $renderedTemplate = renderTemplate('search-result.njk', viewContext)

      expect($renderedTemplate.html()).toContain('A long MRN description t...')
      expect($renderedTemplate.html()).toContain(
        'A long CHED description that should be truncated a...'
      )
      expect($renderedTemplate.html()).toContain(
        '<div role="tooltip" id="tooltip-2">A long MRN description that should be truncated and displayed in full inside a tooltip</div>'
      )
      expect($renderedTemplate.html()).toContain(
        '<div role="tooltip" id="tooltip-1">A long CHED description that should be truncated and displayed in full inside a tooltip</div>'
      )
    })
  })
})
