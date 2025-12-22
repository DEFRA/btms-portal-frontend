import { mapAdminSearchResults } from '../../../src/models/admin-search-results.js'

test('Should throw an error for an invalid search type', () => {
  const invalidSearchType = 'INVALID_TYPE'
  expect(() => {
    mapAdminSearchResults([], invalidSearchType)
  }).toThrow(`Unsupported admin search type: ${invalidSearchType}`)
})

test('Should map search results for all-messages search type', () => {
  const rawSearchResults = [
    { resourceId: 1, message: JSON.stringify({ id: 1, content: 'Test message' }) }
  ]
  const result = mapAdminSearchResults(rawSearchResults, 'all-messages')
  expect(result.length).toBe(1)
  expect(result[0][0]).toContain('{')
  expect(result[0][1]).toContain('"resourceId"')
  expect(result[0][1]).toContain(':')
  expect(result[0][1]).toContain('1')
  expect(result[0][6]).toContain('}')
})

test('Should map search results for all-events search type', () => {
  const rawSearchResults = [
    {
      id: '12241a972b123474b8059c7f',
      created: '2025-12-15T14:26:31.834Z',
      updated: '2025-12-15T14:26:31.878Z',
      resourceId: '25GBAB123ZABCNXYR7',
      resourceType: 'resourceType',
      subResourceType: 'subResourceType',
      message: JSON.stringify({
        id: 2,
        changeSet: []
      })
    }
  ]
  const result = mapAdminSearchResults(rawSearchResults, 'all-events')
  expect(result.length).toBe(1)
  expect(result[0][0]).toContain('{')
  expect(result[0][1]).toContain('"id"')
  expect(result[0][2]).toContain('"created"')
  expect(result[0][3]).toContain('"updated"')
  expect(result[0][4]).toContain('"resourceId"')
  expect(result[0][5]).toContain('"resourceType"')
  expect(result[0][6]).toContain('"subResourceType"')
  expect(result[0][10]).toContain('}')
  expect(result[0].find(line => line.includes('"changeSet"'))).toBeUndefined()
})

test('Should map search results for information search type', () => {
  const rawSearchResults = {
    id: 1,
    description: 'test description'
  }
  const result = mapAdminSearchResults(rawSearchResults, 'information')
  expect(result.length).toEqual(4)
  expect(result[0]).toContain('{')
  expect(result[1]).toContain('"id"')
  expect(result[2]).toContain('"test description"')
  expect(result[3]).toContain('}')
})
