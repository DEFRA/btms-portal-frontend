import { fisNotificationSearchPattern, searchPatterns } from '../../../src/services/search-patterns.js'

test.each([
  ['CHEDA.GB.2025.0000001', true],
  ['CHEDA.NL.2025.0000001', true],
  ['CHEDD.FR.2025.0000002', true],
  ['CHEDP.IT.2025.0000003', true],
  ['CHEDPP.DE.2025.0000004', true],
  ['CHEDA.NL.2025.0000001V', true],
  ['CHEDA.NL.2025.00000001R', true],
  ['CHEDA.G.2025.0000001', false],
  ['CHEDA.GBR.2025.0000001', false],
  ['CHEDA.01.2025.0000001', false],
  ['CHEDA.g1.2025.0000001', false],
  ['CHEDA.2025.0000001', false],
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
  ['GMRA00000AB1', true],
  ['26GBTEST9908000001', true],
  ['26GBtest9908000001', true],
  ['26gbtest9908000001', true],
  ['26GB_TEST990800000', false],
  ['26GB`TEST990800000', false],
  ['26GB[TEST990800000', false],
  ['26GB\\TEST990800000', false],
  ['26GB]TEST990800000', false],
  ['26GB^TEST990800000', false],
  ['26GBTEST990800000', false],
  ['26GBTEST99080000011', false],
  ['IUU.GB.2026.0000001', false]
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

describe('The full CHED reference patterns used by the search service', () => {
  test('should contain CHED in the description to identify full CHED references', () => {
    const fullChedPatterns = searchPatterns.filter(
      ({ description }) => description === 'CHED'
    )

    expect(fullChedPatterns).toHaveLength(1)
    expect(fullChedPatterns.every(({ key }) => key === 'chedId')).toBe(true)
  })
})

test.each([
  ['IUU.GB.2026.1234567', true],
  ['IUU.FR.2026.0000001', true],
  ['IUU.G.2026.1234567', false],
  ['IUU.GBR.2026.1234567', false],
  ['IUU.gb.2026.1234567', false],
  ['IUU.GB.1026.1234567', false],
  ['IUU.GB.2026.123456', false],
  ['IUU.GB.2026.12345678', false],
  ['IUUGB20261234567', false],
  ['CHEDP.GB.2026.1234567', false]
])('The FIS Notification search pattern test for %s should equal %s', (search, expected) => {
  expect(fisNotificationSearchPattern.pattern.test(search)).toBe(expected)
})

test('FIS Notification references are not matched by the main search patterns when isIuuSearchEnabled is off', () => {
  expect(
    searchPatterns.find(({ pattern }) => pattern.test('IUU.GB.2026.1234567'))
  ).toBeUndefined()
})

test('Should match IUU pattern when isIuuSearchEnabled flag is enabled', async () => {
  const { config } = await import('../../../src/config/config.js')
  config.set('isIuuSearchEnabled', true)

  const { searchPatterns } = await import('../../../src/services/search-patterns.js')

  const searchPattern = searchPatterns.find(({ pattern }) =>
    pattern.test('IUU.GB.2026.0000001')
  )

  expect(searchPattern).toBeDefined()
})
