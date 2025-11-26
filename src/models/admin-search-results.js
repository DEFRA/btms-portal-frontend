import Prism from 'prismjs'

const isJson = (value) => {
  const val = value.trim()
  return val.startsWith('{') || val.startsWith('[')
}

const deserializeJson = (value) => {
  if (typeof value === 'string') {
    if (!isJson(value)) {
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

export const mapAdminSearchResults = (rawSearchResults) => {
  const deserializedSearchResults = deserializeJson(rawSearchResults)
  const formattedSearchResults = prettyPrintJson(deserializedSearchResults)

  return Prism.highlight(
    formattedSearchResults,
    Prism.languages.javascript,
    'javascript'
  ).split('\n')
}
