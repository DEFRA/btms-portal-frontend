import { constants } from 'node:http2'
import { paths, queryStringParams, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { searchKeys, searchPatterns } from '../services/search-patterns.js'
import { ADMIN_SEARCH_TYPES, isValidAdminSearchType, search } from '../services/admin.js'
import { mapAdminSearchResults } from '../models/admin-search-results.js'
import { APP_SCOPES } from '../auth/auth-constants.js'

const ADMIN_SEARCH_TEMPLATE = 'admin-search'
const UNSUPPORTED_SEARCH_PATTERNS = [ searchKeys.DUCR, searchKeys.GMR_ID ]

const createResultsModel = (searchTerm, searchType, resourceType, results) => {
  const baseLink = `${paths.ADMIN_SEARCH}?${queryStringParams.SEARCH_TERM}=${searchTerm}`
  return {
    isValid: true,
    links: {
      information: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.INFORMATION}`,
      allEvents: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.ALL_EVENTS}`,
      allMessages: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.ALL_MESSAGES}`
    },
    results,
    resourceType,
    searchTerm,
    searchType,
    searchTypes: ADMIN_SEARCH_TYPES
  }
}

const createErrorModel = (errorCode, searchTerm) => {
  return {
    errorCode,
    isValid: false,
    searchTerm
  }
}

export const adminSearch = {
  method: ['get', 'post'],
  path: paths.ADMIN_SEARCH,
  options: {
    auth: {
      scope: APP_SCOPES.ADMIN,
      strategy: 'session'
    },
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      query: async (value) => {
        const searchTerm = value[queryStringParams.SEARCH_TERM]
        const searchType = value[queryStringParams.SEARCH_TYPE]
        const isSearchTermPresent = searchTerm?.length
        if (!isSearchTermPresent && !searchType?.length) {
          return value
        }
        if (!isSearchTermPresent) {
          throw new Error('SEARCH_TERM_REQUIRED')
        }

        const matchingSearchPattern = searchPatterns.find(({ pattern }) =>
          pattern.test(searchTerm)
        )
        if (matchingSearchPattern
          && !UNSUPPORTED_SEARCH_PATTERNS.includes(matchingSearchPattern.key)
          && isValidAdminSearchType(searchType)) {
          return { resourceType: matchingSearchPattern, ...value }
        }

        throw new Error('SEARCH_TERM_INVALID')
      },
      failAction: async (_, h, error) => {
        return h
          .view(ADMIN_SEARCH_TEMPLATE, createErrorModel(error.message, ''))
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const searchTerm = request.query[queryStringParams.SEARCH_TERM]
    const searchType = request.query[queryStringParams.SEARCH_TYPE]
    const resourceType = request.query[queryStringParams.RESOURCE_TYPE]
    try {
      if (!searchTerm?.length || !searchType?.length) {
        return h.view(ADMIN_SEARCH_TEMPLATE)
      }

      const rawSearchResults = await search(resourceType.key, searchTerm, searchType)
      const formattedSearchResults = mapAdminSearchResults(rawSearchResults, searchType)

      return h.view(ADMIN_SEARCH_TEMPLATE, createResultsModel(
        searchTerm,
        searchType,
        resourceType.description,
        formattedSearchResults)
      )
    } catch (error) {
      if (error.output?.statusCode === constants.HTTP_STATUS_NOT_FOUND) {
        return h.view(
          ADMIN_SEARCH_TEMPLATE,
          createErrorModel('SEARCH_TERM_NOT_FOUND', searchTerm)
        )
      }
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
