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
  expect(result).toStrictEqual(["{\n  \"resourceId\": 1,\n  \"message\": {\n    \"id\": 1,\n    \"content\": \"Test message\"\n  }\n}"])
})

test('Should map search resultexpect(result.length).toBe(1)s for all-events search type', () => {
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
  expect(result).toStrictEqual([
    "{\n  \"id\": \"12241a972b123474b8059c7f\",\n  \"created\": \"2025-12-15T14:26:31.834Z\",\n  \"updated\": \"2025-12-15T14:26:31.878Z\",\n  \"resourceId\": \"25GBAB123ZABCNXYR7\",\n  \"resourceType\": \"resourceType\",\n  \"subResourceType\": \"subResourceType\",\n  \"message\": {\n    \"id\": 2\n  }\n}"
  ])
  expect(result[0].includes('"changeSet"')).toBeFalsy()
})

test('Should map search results for information search type', () => {
  const rawSearchResults = {
    id: 1,
    description: 'test description'
  }
  const result = mapAdminSearchResults(rawSearchResults, 'information')
  expect(result).toStrictEqual('{\n  "id": 1,\n  "description": "test description"\n}')
})
