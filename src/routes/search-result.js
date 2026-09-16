import { paths, queryStringParams } from './route-constants.js'
import { getResourceEvents } from '../services/imports-data-api-client.js'
import { getSearchResults } from '../services/search.js'
import { mapCustomsDeclarations } from '../models/customs-declarations.js'
import { mapPreNotifications } from '../models/pre-notifications.js'
import { mapTracesCheds } from '../models/traces-cheds.js'
import { createRouteConfig } from './search-result-common.js'
import { searchKeys } from '../services/search-patterns.js'
import { mapResourceEvents } from '../models/resource-events.js'
import { createLogger } from '../utils/logger.js'
import { config } from '../config/config.js'
import { isInFeatureGroup } from '../auth/check-groups.js'
import { AUTH_FEATURES } from '../auth/auth-constants.js'

const NANOSECOND_PRECISION = 7

const logger = createLogger()

const searchTermValidator = (key, pattern, value) => {
  return key !== searchKeys.GMR_ID && pattern.test(value)
}

function getNanosecondsAsNumber(nanosecondDate) {
  let nanosecondPart = 0

  if (nanosecondDate.includes('.')) {
    nanosecondPart = nanosecondDate.split('.')[1]

    if (nanosecondPart.includes('Z')) {
      nanosecondPart = nanosecondPart.split('Z')[0]
    }

    nanosecondPart = nanosecondPart.padEnd(NANOSECOND_PRECISION, '0')
  }

  return Number(nanosecondPart)
}

const sortCreatedDescending = (a, b) => {
  if (a.created === undefined && b.created === undefined) { return 0 }

  if (a.created === undefined) { return 1 }

  if (b.created === undefined) { return -1 }

  const aCreatedTime = new Date(a.created).getTime()
  const bCreatedTime = new Date(b.created).getTime()

  // getTime is only accurate to milliseconds. If getTime values are the same, try order by just the nanoseconds part as a number
  if (aCreatedTime === bCreatedTime) {
    const aCreatedNanoseconds = getNanosecondsAsNumber(a.created)
    const bCreatedNanoseconds = getNanosecondsAsNumber(b.created)

    return bCreatedNanoseconds - aCreatedNanoseconds
  }

  return bCreatedTime - aCreatedTime
}

const getEventsFromCustomsDeclarations = async (customsDeclarations, chedGroups) => {
  const allTimelineEvents = chedGroups.flatMap(({ timelineEvents }) => timelineEvents)
  const customsDeclarationEvents = []

  for (const declaration of customsDeclarations) {
    try {
      const declarationResourceEvents = await getResourceEvents(declaration.movementReferenceNumber)
      const declarationTimelineEvents = mapResourceEvents(declaration.movementReferenceNumber, undefined, declarationResourceEvents)
      const timelineEvents = declarationTimelineEvents.concat(allTimelineEvents).sort(sortCreatedDescending)

      customsDeclarationEvents.push({
        mrn: declaration.movementReferenceNumber,
        timelineEvents
      })
    } catch (error) {
      logger.warn(`Unable to retrieve and map timeline resource events for MRN ${declaration.movementReferenceNumber}. ERROR: ${error.message}`)

      customsDeclarationEvents.push({
        mrn: declaration.movementReferenceNumber,
        timelineEvents: []
      })
    }
  }

  return customsDeclarationEvents
}

const getTimelineEvents = async (referenceNumbers) => {
  const timelineGroups = []

  for (const referenceNumber of referenceNumbers) {
    try {
      const resourceEvents = await getResourceEvents(referenceNumber)

      timelineGroups.push({
        chedRef: referenceNumber,
        timelineEvents: mapResourceEvents(undefined, referenceNumber, resourceEvents).sort(sortCreatedDescending)
      })
    } catch (error) {
      logger.warn(`Unable to retrieve and map timeline resource events for ${referenceNumber}. ERROR: ${error.message}`)

      timelineGroups.push({
        chedRef: referenceNumber,
        timelineEvents: []
      })
    }
  }

  return timelineGroups
}

const getAllEvents = async (customsDeclarations, preNotifications, tracesCheds) => {
  const ipaffsChedGroups = await getTimelineEvents(preNotifications.map(({ referenceNumber }) => referenceNumber))
  const tracesChedGroups = await getTimelineEvents(tracesCheds.map(({ reference }) => reference))
  const chedGroups = ipaffsChedGroups.concat(tracesChedGroups)

  if (customsDeclarations.length === 0) {
    return chedGroups
  }

  return getEventsFromCustomsDeclarations(customsDeclarations, chedGroups)
}

const includesInternalDecisionCodes = (customsDeclarations, codes) => {
  return customsDeclarations.some(declaration => {
    return declaration.clearanceDecision?.results?.some(result => {
      return codes.includes(result.internalDecisionCode)
    })
  })
}

export const searchResult = createRouteConfig(searchTermValidator, paths.SEARCH_RESULT, async (request, h) => {
  const searchTerm = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()
  const searchResults = await getSearchResults(request.pre.searchQuery)
  const showTracesCheds = config.get('isTracesChedsEnabled')

  if (
    searchResults.customsDeclarations.length === 0 &&
    searchResults.importPreNotifications.length === 0 &&
    !(showTracesCheds && searchResults.cheds?.length > 0)
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
  const tracesCheds = showTracesCheds ? mapTracesCheds(searchResults, searchTerm) : []
  const timelineEvents = await getAllEvents(customsDeclarations, preNotifications, tracesCheds)

  const showLevelNoMatchBanner = isInFeatureGroup(AUTH_FEATURES.LEVEL_NO_MATCH_SEARCH_RESULTS, request.auth.credentials.scope)
  const showLevel2NoMatchText = showLevelNoMatchBanner && includesInternalDecisionCodes(searchResults.customsDeclarations, ['E20'])
  const showLevel3NoMatchText = showLevelNoMatchBanner && includesInternalDecisionCodes(searchResults.customsDeclarations, ['E30', 'E31'])
  const showLevelsResultTab = showLevel2NoMatchText || showLevel3NoMatchText

  const viewModel = {
    resultsPage: true,
    searchTerm,
    customsDeclarations,
    preNotifications,
    tracesCheds,
    timelineEvents,
    showLevel2NoMatchText,
    showLevel3NoMatchText,
    showLevelsResultTab,
    showTracesCheds
  }

  return h.view('search-result', viewModel)
})
