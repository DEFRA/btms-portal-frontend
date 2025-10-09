import { renderTemplate } from './template.test.helper.js'

const createDeclarationContext = (finalState) => {
  return {
    searchTerm: '25GBABCDEFGHIJKLMNOP',
    customsDeclaration: {
      movementReferenceNumber: '25GBABCDEFGHIJKLMNOP',
      declarationUcr: 'TEST-DUCR',
      status: 'Current',
      updated: '2025-01-01 09:00:00',
      finalState
    }
  }
}

describe('Declaration Summary - CDS Status Highlighting', () => {
  test.each([
    [null, 'btms-status-tag govuk-tag govuk-tag--yellow'],
    [undefined, 'btms-status-tag govuk-tag govuk-tag--yellow'],
    ['0', 'btms-status-tag govuk-tag govuk-tag--green'],
    ['1', 'btms-status-tag govuk-tag govuk-tag--red'],
    ['2', 'btms-status-tag govuk-tag govuk-tag--red'],
    ['3', 'btms-status-tag govuk-tag govuk-tag--red'],
    ['4', 'btms-status-tag govuk-tag govuk-tag--red'],
    ['5', ''],
    ['6', ''],
    ['99', '']
  ])(
    'Should set correct tag class when finalState is %s',
    (finalState, expectedClass) => {
      const viewContext = createDeclarationContext(finalState)
      const renderedTemplate = renderTemplate(
        'includes/declaration-summary.njk',
        viewContext
      )
      const statusSpan = renderedTemplate('span:contains("Current")')

      expect(statusSpan.attr('class')).toBe(expectedClass)
    }
  )
})
