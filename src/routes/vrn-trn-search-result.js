import { CACHE_CONTROL_NO_STORE, paths, queryStringParams } from './route-constants.js'
import { searchKeys } from '../services/search-patterns.js'
import { getMetricNameBySearchType, METRIC_NAMES, metricsCounter } from '../utils/metrics.js'
import { getRelatedImportDeclarations } from '../services/imports-data-api-client.js'
import { mapVrnTrnGoodsVehicleMovements } from '../models/goods-vehicle-movements.js'
import { searchValidation } from './search-result-common.js'

export const vrnTrnSearchResult = {
  method: 'get',
  path: paths.VRN_TRN_SEARCH_RESULT,
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE,
    validate: searchValidation,
    pre: [
      {
        method: async (request) => {
          const value = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()

          const metricName = getMetricNameBySearchType(searchKeys.VRN_TRN)
          if (metricName) {
            await metricsCounter(metricName)
          }

          return { [searchKeys.VRN_TRN]: value }
        },
        assign: 'searchQuery'
      }
    ],
    handler: async (request, h) => {
      const searchTerm = request.query[queryStringParams.SEARCH_TERM].trim().toUpperCase()
      const data = await getRelatedImportDeclarations(request.pre.searchQuery)

      if (data.goodsVehicleMovements.length === 0) {
        request.yar.flash('searchError', {
          searchTerm,
          isValid: false,
          errorCode: 'SEARCH_TERM_NOT_FOUND'
        })

        await metricsCounter(METRIC_NAMES.VRN_TRN_NOT_FOUND)
        request.logger.info(`No search result for ${searchTerm}`)

        return h.redirect(paths.SEARCH).takeover()
      }

      const linkedGmrs = mapVrnTrnGoodsVehicleMovements(data)

      const viewModel = {
        searchTerm,
        linkedGmrs
      }

      return h.view('vrn-trn-search-result', viewModel)
    }
  }
}
