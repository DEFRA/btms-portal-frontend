import { renderTemplate } from './template.test.helper.js'

describe('GMR Results', () => {
  let $renderedTemplate

  test('Should render page', () => {
    const viewContext = {
      searchTerm: 'GMRA00000AB1',
      vehicleDetails: {
        vehicleRegistrationNumber: "ABC 111",
        trailerRegistrationNumbers: [
          'ABC 222',
          'ABC 333'
        ]
      },
      linkedCustomsDeclarations: [
        {
          isKnownMrn: true,
          mrn: '25GB00000000000001',
          cdsStatus: 'In progress - Awaiting trader',
          btmsDecision: 'Hold - Decision not given',
          finalState: undefined
        },
        {
          isKnownMrn: false,
          mrn: '25GB00000000000002',
          cdsStatus: 'Unknown',
          btmsDecision: 'Unknown',
          finalState: undefined
        }
      ]
    }

    $renderedTemplate = renderTemplate('gmr-results.njk', viewContext)

    expect($renderedTemplate.html()).toContain('Showing result for')
    expect($renderedTemplate.html()).toContain('GMRA00000AB1')
    expect($renderedTemplate.html()).toContain('<span class="gmr-number-plate gmr-number-plate__front" aria-label="Vehicle registration number ABC 111">ABC 111</span>')
    expect($renderedTemplate.html()).toContain('<span class="gmr-number-plate gmr-number-plate__rear" aria-label="Trailer registration number ABC 222">ABC 222</span>')
    expect($renderedTemplate.html()).toContain('<span class="gmr-number-plate gmr-number-plate__rear" aria-label="Trailer registration number ABC 333">ABC 333</span>')

    expect($renderedTemplate.html()).toContain('<a href="/search-result?searchTerm=25GB00000000000001">25GB00000000000001</a>')
    expect($renderedTemplate.html()).toContain('<span class="govuk-!-font-weight-bold govuk-tag govuk-tag--yellow">In progress - Awaiting trader</span>')
    expect($renderedTemplate.html()).toContain('<td class="govuk-table__cell">Hold - Decision not given</td>')

    expect($renderedTemplate.html()).toContain('<div class="tooltiplink gmr-mrn__unknown" aria-describedby="25GB00000000000002">25GB00000000000002<div class="gmr-mrn__tooltip" role="tooltip" id="25GB00000000000002">This MRN cannot be found in BTMS. The MRN may not have SPS goods associated with it or HMRC have not sent details of this MRN to BTMS.</div></div>')
    expect($renderedTemplate.html()).toContain('<span class="govuk-!-font-weight-bold govuk-tag govuk-tag--grey">Unknown</span>')
    expect($renderedTemplate.html()).toContain('<td class="govuk-table__cell">Unknown</td>')
  })
})
