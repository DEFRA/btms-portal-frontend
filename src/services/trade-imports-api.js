import { config } from '../config/config.js'
import { getWithErrorHandling } from '../utils/api.js'

const { baseUrl, password, username } = config.get('btmsApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')

const get = getWithErrorHandling(token)

export const getCustomsDeclaration = (request, mrn) =>
  get(request, `${baseUrl}/customs-declarations/${mrn}`)

export const getImportPreNotification = (request, chedId) =>
  get(request, `${baseUrl}/import-pre-notifications/${chedId}`)

export const getRelatedImportDeclarations = (request, query) => {
  return get(
    request,
    `${baseUrl}/related-import-declarations?${new URLSearchParams(query)}`
  )
}

export const getResourceEvents = (request, resourceId) =>
  get(request, `${baseUrl}/resource-events/${resourceId}`)
