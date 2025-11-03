import { paths } from './route-constants.js'
import { results } from './results.js'
import { getRelatedImportDeclarations } from '../services/related-import-declarations.js'
import { mapVehicleDetails } from '../models/vehicle-details.js'
import { mapGmrCustomsDeclarations } from '../models/customs-declarations.js'

export const gmrResults = results(true, paths.GMR_RESULTS, async (request, h) => {
  const searchTerm = request.query.searchTerm.trim()
  const data = await getRelatedImportDeclarations(request)

  if (data.goodsVehicleMovements.length === 0) {
    request.yar.flash('searchError', {
      searchTerm,
      isValid: false,
      errorCode: 'SEARCH_TERM_NOT_FOUND'
    })

    return h.redirect(paths.SEARCH).takeover()
  }

  const vehicleDetails = mapVehicleDetails(data)
  const linkedCustomsDeclarations = mapGmrCustomsDeclarations(data)

  const viewModel = {
    searchTerm,
    vehicleDetails,
    linkedCustomsDeclarations
  }

  return h.view('gmr-results', viewModel)
})
