import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'

const dataApiConfig = config.get('btmsApi')
const dataApiClient = new ApiClient(dataApiConfig)

export const getCustomsDeclaration = (mrn) =>
  dataApiClient.get(`customs-declarations/${mrn}`)

export const getImportPreNotification = (chedId) =>
  dataApiClient.get(`import-pre-notifications/${chedId}`)

export const getTracesChed = (chedId) =>
  dataApiClient.get(`traces-cheds/${chedId}`)

export const getRelatedImportDeclarations = async (query) => {
  const results = await dataApiClient.get(`related-import-declarations?${new URLSearchParams(query)}`)

  return config.get('isTracesChedsEnabled') ? results : { ...results, cheds: [], chedReservations: [] }
}

export const getResourceEvents = (resourceId) =>
  dataApiClient.get(`resource-events/${resourceId}`)
