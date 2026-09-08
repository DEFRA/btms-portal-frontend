import { constants } from 'http2'

import { config } from '../config/config.js'
import {
  getRelatedImportDeclarations,
  getTracesChed,
  getTracesChedCustomsDeclarations
} from './imports-data-api-client.js'
import { searchPatterns } from './search-patterns.js'

const FULL_CHED_REF_DESCRIPTIONS = new Set(['CHED'])

const isFullChedReference = (chedId) =>
  searchPatterns
    .filter(({ description }) => FULL_CHED_REF_DESCRIPTIONS.has(description))
    .some(({ pattern }) => pattern.test(chedId))

const isNotFound = (error) =>
  error?.isBoom && error?.output?.statusCode === constants.HTTP_STATUS_NOT_FOUND

const fetchTracesChed = async (chedId) => {
  try {
    return await getTracesChed(chedId)
  } catch (error) {
    if (isNotFound(error)) {
      return null
    }
    throw error
  }
}

export const getSearchResults = async (searchQuery) => {
  const tracesEnabled = config.get('isTracesChedsEnabled')
  const chedId = searchQuery.chedId
  const searchForTracesChed = tracesEnabled && chedId && isFullChedReference(chedId)

  if (!searchForTracesChed) {
    return getRelatedImportDeclarations(searchQuery)
  }

  const tracesChed = await fetchTracesChed(chedId)
  if (!tracesChed) {
    return getRelatedImportDeclarations(searchQuery)
  }

  const customsDeclarations = await getTracesChedCustomsDeclarations(chedId)

  return {
    customsDeclarations: customsDeclarations.customsDeclarations,
    importPreNotifications: [],
    goodsVehicleMovements: [],
    cheds: [tracesChed]
  }
}
