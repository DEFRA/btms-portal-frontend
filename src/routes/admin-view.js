import Prism from 'prismjs'

import {
  getCustomsDeclaration as getCustomsDeclarations,
  getImportPreNotification as getImportPreNotifications,
  getResourceEvents
} from '../services/trade-imports-api.js'
import { paths, CACHE_CONTROL_NO_STORE } from './route-constants.js'
import { searchPatterns } from '../services/search-patterns.js'
import { getRawMessages } from '../services/trade-imports-processor.js'
import { STATUS_CODES } from '../utils/api.js'

const ADMIN_VIEW_TEMPLATE = 'admin-view'
const VALID_TYPES = new Set(['all-events', 'all-messages', 'information'])

const TYPE_HANDLERS = {
  'all-events': getResourceEvents,
  'all-messages': getRawMessages
}

const INFORMATION_HANDLERS = {
  mrn: getCustomsDeclarations,
  chedId: getImportPreNotifications
}

const fetchResults = async (request, resourceType) => {
  const { searchTerm, type } = request.query

  const handler =
    type === 'information'
      ? INFORMATION_HANDLERS[resourceType]
      : TYPE_HANDLERS[type]

  if (handler) {
    return handler(request, searchTerm)
  }

  throw new Error(`Unsupported support result request: ${type}/${searchTerm}`)
}

const looksLikeJson = (value) => {
  const val = value.trim()
  return val.startsWith('{') || val.startsWith('[')
}

const deserializeJson = (value) => {
  if (typeof value === 'string') {
    if (!looksLikeJson(value)) {
      return value
    }

    try {
      return deserializeJson(JSON.parse(value))
    } catch {
      return value
    }
  }

  if (Array.isArray(value)) {
    return value.map(deserializeJson)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, deserializeJson(val)])
    )
  }

  return value
}

const prettyPrintJson = (json) => JSON.stringify(json, null, 2)

const getFormattedResults = async (request, resourceType) => {
  const results = deserializeJson(await fetchResults(request, resourceType))
  const formattedResults = prettyPrintJson(results)

  return Prism.highlight(
    formattedResults,
    Prism.languages.javascript,
    'javascript'
  ).split('\n')
}

export const adminView = {
  method: ['get', 'post'],
  path: paths.ADMIN_VIEW,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    validate: {
      query: async (value) => {
        if (!value.searchTerm && !value.type) {
          return value
        }

        const resourceType = searchPatterns.find(({ pattern }) =>
          pattern.test(value.searchTerm)
        )

        if (resourceType && VALID_TYPES.has(value.type)) {
          return { resourceType, ...value }
        }

        throw new Error('SEARCH_TERM_INVALID')
      },
      failAction: async (_, h, error) => {
        return h
          .view(ADMIN_VIEW_TEMPLATE, {
            searchTerm: '',
            isValid: false,
            errorCode: error.message
          })
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const { resourceType, searchTerm, type } = request.query

    if (!searchTerm || !type) {
      return h.view(ADMIN_VIEW_TEMPLATE)
    }

    try {
      return h.view(ADMIN_VIEW_TEMPLATE, {
        resourceType: resourceType.description,
        results: await getFormattedResults(request, resourceType.key),
        searchTerm,
        type
      })
    } catch (error) {
      if (error.output?.statusCode === STATUS_CODES.NOT_FOUND) {
        return h.view(ADMIN_VIEW_TEMPLATE, {
          errorCode: 'SEARCH_TERM_NOT_FOUND',
          searchTerm,
          isValid: false
        })
      }
      return h.view(ADMIN_VIEW_TEMPLATE)
    }
  }
}
