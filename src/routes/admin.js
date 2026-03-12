import { constants } from 'node:http2'
import { paths, queryStringParams, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { searchKeys, searchPatterns } from '../services/search-patterns.js'
import {
  ADMIN_SEARCH_TYPES,
  getDlqCounts,
  isValidAdminSearchType,
  search
} from '../services/admin.js'
import { mapAdminSearchResults } from '../models/admin-search-results.js'
import { APP_SCOPES } from '../auth/auth-constants.js'
import { config } from '../config/config.js'
import { mapDlqs } from '../models/admin-dlq.js'

const ADMIN_TEMPLATE = 'admin'
const UNSUPPORTED_SEARCH_PATTERNS = [ searchKeys.DUCR, searchKeys.GMR_ID ]
const dlqConfigs = config.get('dlq')

const createResultsModel = (searchTerm, searchType, resourceType, results, dlqModel) => {
  const baseLink = `${paths.ADMIN}?${queryStringParams.SEARCH_TERM}=${searchTerm}`
  return {
    isValid: true,
    links: {
      information: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.INFORMATION}#messages-view`,
      allEvents: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.ALL_EVENTS}#messages-view`,
      allMessages: `${baseLink}&${queryStringParams.SEARCH_TYPE}=${ADMIN_SEARCH_TYPES.ALL_MESSAGES}#messages-view`
    },
    results,
    resourceType,
    searchTerm,
    searchType,
    searchTypes: ADMIN_SEARCH_TYPES,
    dlq: dlqModel
  }
}

const createErrorModel = (errorCode, searchTerm, dlqModel) => {
  return {
    errorCode,
    isValid: false,
    searchTerm,
    dlq: dlqModel
  }
}

const createRedriveModel = (redriveRequested, queueCounts, dlqs) => {
  return {
    redriveGroup: dlqs.find(group => group.queues.some(queue => queue.sqsQueueName === redriveRequested))?.groupName,
    redriveQueue: redriveRequested,
    redriveQueueCount: queueCounts.find(queueCount => queueCount.sqsQueueName === redriveRequested)?.count,
  }
}

const isValidDlq = (redriveQueueRequested) => {
  return redriveQueueRequested && dlqConfigs.groups.some(configGroup =>
    configGroup.queues.some(configuredQueue => configuredQueue.sqsQueueName === redriveQueueRequested))
}

const createDlqModel = async (request) => {
  const queueCounts = await getDlqCounts(dlqConfigs)
  const dlqs = mapDlqs(dlqConfigs, queueCounts)
  const redriveQueueRequested = request.query[queryStringParams.REDRIVE]
  const redrive = isValidDlq(redriveQueueRequested) ? createRedriveModel(redriveQueueRequested, queueCounts, dlqs) : undefined

  return {
    dlqs,
    redrive
  }
}

export const admin = {
  method: ['get', 'post'],
  path: paths.ADMIN,
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
      failAction: async (request, h, error) => {
        const dlqModel = await createDlqModel(request)

        return h
          .view(ADMIN_TEMPLATE, createErrorModel(error.message, '', dlqModel))
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const dlqModel = await createDlqModel(request)

    const searchTerm = request.query[queryStringParams.SEARCH_TERM]
    const searchType = request.query[queryStringParams.SEARCH_TYPE]
    const resourceType = request.query[queryStringParams.RESOURCE_TYPE]

    try {
      if (!searchTerm?.length || !searchType?.length) {
        return h.view(ADMIN_TEMPLATE, { dlq: dlqModel })
      }

      const rawSearchResults = await search(resourceType.key, searchTerm, searchType)
      const formattedSearchResults = mapAdminSearchResults(rawSearchResults, searchType)

      return h.view(ADMIN_TEMPLATE, createResultsModel(
        searchTerm,
        searchType,
        resourceType.description,
        formattedSearchResults,
        dlqModel)
      )
    } catch (error) {
      if (error.output?.statusCode === constants.HTTP_STATUS_NOT_FOUND) {
        return h.view(
          ADMIN_TEMPLATE,
          createErrorModel('SEARCH_TERM_NOT_FOUND', searchTerm, dlqModel)
        )
      }
      request.logger.setBindings({ error })
      request.logger.error(error)
      throw error
    }
  }
}
