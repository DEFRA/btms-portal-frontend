import { csvValue } from '../../../src/utils/csv.js'

test('wraps a plain value in quotes', () => {
  expect(csvValue('CHEDA.GB.2025.1013501')).toBe('"CHEDA.GB.2025.1013501"')
})

test('keeps a comma inside the quoted cell', () => {
  expect(csvValue('CHEDA.GB.2025,1013501')).toBe('"CHEDA.GB.2025,1013501"')
})

test('doubles an embedded quote', () => {
  expect(csvValue('a "quoted" decision')).toBe('"a ""quoted"" decision"')
})

test('renders a missing value as an empty quoted cell', () => {
  expect(csvValue(null)).toBe('""')
  expect(csvValue(undefined)).toBe('""')
})

test('stringifies numbers and booleans', () => {
  expect(csvValue(100)).toBe('"100"')
  expect(csvValue(false)).toBe('"false"')
})
