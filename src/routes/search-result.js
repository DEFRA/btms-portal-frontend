import { paths, queryStringParams } from './route-constants.js'
import { getRelatedImportDeclarations, getResourceEvents } from '../services/imports-data-api-client.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'
import { createRouteConfig } from './search-result-common.js'
import { searchKeys } from '../services/search-patterns.js'
import { mapResourceEvents } from '../models/resource-events.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const searchTermValidator = (key, pattern, value) => {
  return key !== searchKeys.GMR_ID && pattern.test(value)
}

const sortCreatedDescending = (a, b) => {
  const aCreated = new Date(a.created).getTime()
  const bCreated = new Date(b.created).getTime()

  return bCreated - aCreated
}

const getChedTimelineEvents = async (declaration) => {
  let chedTimelineEvents = []

  for (const commodity of declaration.commodities) {
    if (commodity?.documents) {
      for (const document of commodity.documents) {
        const chedResourceEvents = await getResourceEvents(document.documentReference)
        chedTimelineEvents = chedTimelineEvents.concat(mapResourceEvents(declaration.movementReferenceNumber, chedResourceEvents))
      }
    }
  }

  return chedTimelineEvents
}

const getAllEvents = async (customsDeclarations) => {
  const mrnEvents = []

  for (const declaration of customsDeclarations) {
    try {
      const declarationResourceEvents = await getResourceEvents(declaration.movementReferenceNumber)
      const declarationTimelineEvents = mapResourceEvents(declaration.movementReferenceNumber, declarationResourceEvents)

      const chedTimelineEvents = await getChedTimelineEvents(declaration)

      const timelineEvents = declarationTimelineEvents.concat(chedTimelineEvents).sort((a, b) => sortCreatedDescending(a, b))

      mrnEvents.push({
        mrn: declaration.movementReferenceNumber,
        timelineEvents
      })
    } catch (error) {
      logger.warn(`Unable to retrieve and map timeline resource events for MRN ${declaration.movementReferenceNumber}. ERROR: ${error.message}`)
      mrnEvents.push({
        mrn: declaration.movementReferenceNumber,
        timelineEvents: []
      })
    }
  }

  return mrnEvents
}

export const searchResult = createRouteConfig(searchTermValidator, paths.SEARCH_RESULT, async (request, h) => {
  const searchTerm = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()
  const searchResults = await getRelatedImportDeclarations(request.pre.searchQuery)

  if (
    searchResults.customsDeclarations.length === 0 &&
    searchResults.importPreNotifications.length === 0
  ) {
    request.yar.flash('searchError', {
      searchTerm,
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
    })

    return h.redirect(paths.SEARCH).takeover()
  }

  const customsDeclarations = mapCustomsDeclarations(searchResults, searchTerm)
  const preNotifications = mapPreNotifications(searchResults, searchTerm)
  const timelineEvents = await getAllEvents(customsDeclarations)

  const viewModel = {
    resultsPage: true,
    searchTerm,
    customsDeclarations,
    preNotifications,
    timelineEvents
  }

  return h.view('search-result', viewModel)
})
