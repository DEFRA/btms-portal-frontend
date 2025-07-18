import { searchPatterns } from '../../../src/services/search-patterns.js'

test.each([
  ['CHEDA.GB.2025.0000001', true],
  ['CHEDA.GB.2025.000000', false],
  ['CHEDA.GB.2025.0000001V', true],
  ['CHEDA.GB.2025.0000001R', true],
  ['0000001', true],
  ['000000', false],
  ['0000001V', true],
  ['0000001R', true],
  ['GBCHD2024.5286242', true],
  ['GBCHD2024.528624', false],
  ['GBCHD2024.5286242V', true],
  ['GBCHD2024.5286242R', true]
])('The search pattern test for %s should equal %s', (search, expected) => {
  const searchPattern = searchPatterns.find(({ pattern }) => pattern.test(search))
  if (expected) {
    expect(searchPattern).toBeDefined()
    return
  }

  expect(searchPattern).toBeUndefined()
})
