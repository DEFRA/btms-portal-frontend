import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const dataApiConfig = config.get('btmsApi')
const dataApiClient = new ApiClient(dataApiConfig)

export const getCustomsDeclaration = (mrn) =>
  dataApiClient.get(`customs-declarations/${mrn}`)

export const getImportPreNotification = (chedId) =>
  dataApiClient.get(`import-pre-notifications/${chedId}`)

export const getRelatedImportDeclarations = (query) =>
  dataApiClient.get(`related-import-declarations?${new URLSearchParams(query)}`)

export const getResourceEvents = (resourceId) =>
  dataApiClient.get(`resource-events/${resourceId}`)
