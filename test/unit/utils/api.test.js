import { ApiClient } from '../../../src/utils/api.js'
import { config } from '../../../src/config/config.js'

const mockGet = jest.fn()

jest.mock('@hapi/wreck', () => ({
  get: (...args) => mockGet(...args)
}))

jest.mock('../../../src/config/config.js', () => ({
  config: {
    get: jest.fn()
  }
}))


const apiConfig = {
  baseUrl: 'https://api.example.com',
  username: 'testuser',
  password: 'testpassword'
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockResolvedValue({ payload: { data: 'test' } })
})

test('get() should include x-api-key header when cdpApiKey is configured', async () => {
  config.get.mockReturnValue('test-api-key')

  const client = new ApiClient(apiConfig)
  await client.get('test-endpoint')

  expect(mockGet).toHaveBeenCalledWith(
    'https://api.example.com/test-endpoint',
    expect.objectContaining({
      headers: expect.objectContaining({
        authorization: expect.stringMatching(/^Basic /),
        'x-api-key': 'test-api-key'
      }),
      json: 'force'
    })
  )
})

test('get() should not include x-api-key header when cdpApiKey is not configured', async () => {
  config.get.mockReturnValue(null)

  const client = new ApiClient(apiConfig)
  await client.get('test-endpoint')

  expect(mockGet).toHaveBeenCalledWith(
    'https://api.example.com/test-endpoint',
    expect.objectContaining({
      headers: {
        authorization: expect.stringMatching(/^Basic /)
      },
      json: 'force'
    })
  )

  const calledHeaders = mockGet.mock.calls[0][1].headers
  expect(calledHeaders).not.toHaveProperty('x-api-key')
})

test('get() should return the payload from the response', async () => {
  config.get.mockReturnValue(null)
  mockGet.mockResolvedValue({ payload: { result: 'success' } })

  const client = new ApiClient(apiConfig)
  const result = await client.get('test-endpoint')

  expect(result).toEqual({ result: 'success' })
})

test('get() should construct correct basic auth header', async () => {
  config.get.mockReturnValue(null)

  const client = new ApiClient(apiConfig)
  await client.get('test-endpoint')

  const expectedCredentials = Buffer.from('testuser:testpassword').toString('base64')
  expect(mockGet).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: {
        authorization: `Basic ${expectedCredentials}`
      }
    })
  )
})
