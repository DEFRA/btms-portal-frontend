import wreck from '@hapi/wreck'
import { config } from '../config/config.js'

const { baseUrl, password, username } = config.get('btmsApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')

export const getRelatedImportDeclarations = async (request) => {
  const query = new URLSearchParams(request.pre.searchQuery)

  try {
    const { payload } = await wreck.get(
      `${baseUrl}/related-import-declarations?${query}`,
      {
        headers: { authorization: `Basic ${token}` },
        json: 'strict'
      }
    )

    return payload
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
