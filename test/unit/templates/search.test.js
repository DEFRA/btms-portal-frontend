import { renderTemplate } from './template.test.helper.js'

describe('Search Component', () => {
  let $renderedTemplate

  describe('With no errors', () => {
    beforeEach(() => {
      $renderedTemplate = renderTemplate('search.njk')
    })

    test('Should render search with no error message', () => {
      expect($renderedTemplate('[id="search-term-error"]')).toHaveLength(0)
      expect($renderedTemplate.html()).not.toContain(
        'You must enter a valid MRN, CHED or DUCR'
      )
      expect($renderedTemplate.html()).not.toContain(
        'This MRN, CHED or DUCR reference cannot be found'
      )
    })
  })

  describe('With invalid search term error', () => {
    beforeEach(() => {
      $renderedTemplate = renderTemplate('search.njk', {
        searchTerm: 'FOO',
        isValid: false,
        errorCode: 'SEARCH_TERM_INVALID'
      })
    })

    test('Should render search with correct error message', () => {
      expect($renderedTemplate('[id="search-term-error"]')).toHaveLength(1)
      expect($renderedTemplate.html()).toContain(
        'You must enter a valid MRN, CHED or DUCR'
      )
      expect($renderedTemplate.html()).not.toContain(
        'This MRN, CHED or DUCR reference cannot be found'
      )
    })
  })

  describe('With search term not found error', () => {
    beforeEach(() => {
      $renderedTemplate = renderTemplate('search.njk', {
        searchTerm: 'FOO',
        isValid: false,
        errorCode: 'SEARCH_TERM_NOT_FOUND'
      })
    })

    test('Should render search with correct error message', () => {
      expect($renderedTemplate('[id="search-term-error"]')).toHaveLength(1)
      expect($renderedTemplate.html()).not.toContain(
        'You must enter a valid MRN, CHED or DUCR'
      )
      expect($renderedTemplate.html()).toContain(
        'This MRN, CHED or DUCR reference cannot be found'
      )
    })
  })
})
