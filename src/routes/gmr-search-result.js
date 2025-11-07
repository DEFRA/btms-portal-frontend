import { paths, queryStringParams } from './route-constants.js'
import { createRouteConfig } from './search-result-common.js'
import { getRelatedImportDeclarations } from '../services/related-import-declarations.js'
import { mapGoodsVehicleMovements } from '../models/goods-vehicle-movements.js'
import { searchKeys } from '../services/search-patterns.js'
import { metricsCounter } from '../utils/metrics.js'
import { metricName } from '../models/model-constants.js'

const searchTermValidator = (key, pattern, value) => {
  return key === searchKeys.GMR_ID && pattern.test(value)
}

export const gmrSearchResult = createRouteConfig(searchTermValidator, paths.GMR_SEARCH_RESULT, async (request, h) => {
  const searchTerm = request.query[queryStringParams.SEARCH_TERM].trim()
  const data = await getRelatedImportDeclarations(request)

  if (data.goodsVehicleMovements.length === 0) {
    request.yar.flash('searchError', {
      searchTerm,
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
    })

    metricsCounter(metricName.GMR_NOT_FOUND)

    return h.redirect(paths.SEARCH).takeover()
  }

  const goodsVehicleMovement = mapGoodsVehicleMovements(data)

  const viewModel = {
    searchTerm,
    goodsVehicleMovement
  }

  return h.view('gmr-search-result', viewModel)
})
