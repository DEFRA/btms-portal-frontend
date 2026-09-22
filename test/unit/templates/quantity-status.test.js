import { renderTemplate } from './template.test.helper.js'

const renderWithStatus = (quantityStatus) =>
  renderTemplate('includes/declaration-html.njk', {
    showQuantityStatus: true,
    customsDeclaration: {
      hasTracesChed: true,
      movementReferenceNumber: '25GBABCDEFGHIJKLMNOP',
      commodities: [
        {
          id: 'c1',
          itemNumber: 1,
          taricCommodityCode: '0807190050',
          goodsDescription: 'WHITE HONEYDEW',
          weightOrQuantity: 14145,
          decisions: [
            {
              id: 'd1',
              documentReference: 'GBCHD2026.7174423',
              match: true,
              authority: { text: 'PHSI', value: 'PHSI' },
              decision: 'Release - Inspection complete',
              quantityStatus
            }
          ]
        }
      ]
    }
  })

describe('Quantity status column', () => {
  test.each([
    ['Unreserved', 'govuk-tag--grey'],
    ['Reserved', 'govuk-tag--yellow'],
    ['Finalised', 'govuk-tag--green']
  ])('renders %s as a %s tag', (status, modifier) => {
    const $ = renderWithStatus(status)

    const cell = $('td').eq(4)

    expect(cell.text().trim()).toBe(status)
    expect(cell.find('strong').attr('class')).toContain(modifier)
  })

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', '']
  ])('renders nothing for %s', (_label, status) => {
    const $ = renderWithStatus(status)

    expect($('table.btms-declaration td').eq(4).text().trim()).toBe('')
    expect($('table.btms-declaration td').eq(4).find('strong')).toHaveLength(0)
  })

  test('renders the Quantity status header when enabled', () => {
    const $ = renderTemplate('includes/declaration-html.njk', {
      showQuantityStatus: true,
      customsDeclaration: { hasTracesChed: true, commodities: [] }
    })

    expect($('table.btms-declaration th').eq(4).text()).toBe('Quantity status')
  })

  test('does not show the Quantity status column when the feature is disabled', () => {
    const $ = renderTemplate('includes/declaration-html.njk', {
      showQuantityStatus: false,
      customsDeclaration: { hasTracesChed: true, commodities: [] }
    })

    expect($('table.btms-declaration th').map((i, el) => $(el).text()).get())
      .not.toContain('Quantity status')
  })

  test('does not show the Quantity status column when the declaration has no quantity status', () => {
    const $ = renderTemplate('includes/declaration-html.njk', {
      showQuantityStatus: true,
      customsDeclaration: { hasTracesChed: false, commodities: [] }
    })

    expect($('table.btms-declaration th').map((i, el) => $(el).text()).get())
      .not.toContain('Quantity status')
  })
})