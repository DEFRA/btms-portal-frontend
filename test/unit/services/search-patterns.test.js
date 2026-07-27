import { searchPatterns } from '../../../src/services/search-patterns.js'

test.each([
  ['CHEDA.GB.2025.0000001', true],
  ['CHEDA.GB.2025.000000', false],
  ['CHEDA.GB.2025.0000001V', true],
  ['CHEDA.GB.2025.0000001R', true],
  ['CHEDA.GB.2025.00000001V', true],
  ['CHEDA.GB.2025.00000001R', true],
  ['CHEDA.GB.2025.000000001V', false],
  ['CHEDA.GB.2025.000000001R', false],
  ['0000001', true],
  ['00000001', true],
  ['000000', false],
  ['0000001V', true],
  ['00000001V', true],
  ['0000001R', true],
  ['00000001R', true],
  ['GBCHD2024.5286242', true],
  ['GBCHD2024.52862421', true],
  ['GBCHD2024.528624', false],
  ['GBCHD2024.5286242V', true],
  ['GBCHD2024.52862422V', true],
  ['GBCHD2024.5286242R', true],
  ['GBCHD2024.52862422R', true],
  ['GMRA00000AB1', true]
])('The search pattern test for %s should equal %s', (search, expected) => {
  const searchPattern = searchPatterns.find(({ pattern }) =>
    pattern.test(search)
  )
  if (expected) {
    expect(searchPattern).toBeDefined()
    return
  }

  expect(searchPattern).toBeUndefined()
})
