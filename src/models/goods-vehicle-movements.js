import boom from '@hapi/boom'
import { getCustomsDeclarationStatus } from './customs-declarations.js'
import { metricName, ORDERED_CLEARANCE_DECISIONS } from './model-constants.js'
import { paths, queryStringParams } from '../routes/route-constants.js'
import { metricsCounter } from '../utils/metrics.js'

const getBtmsDecision = (clearanceDecision) => {
  return ORDERED_CLEARANCE_DECISIONS.find(decisionCheck => {
    if (decisionCheck.type === 'item' && clearanceDecision.items.some(item => item.checks.some(itemCheck =>
      itemCheck.decisionCode === decisionCheck.code && (decisionCheck.checkCode === undefined || itemCheck.checkCode === decisionCheck.checkCode)))) {
      return true
    }

    return decisionCheck.type === 'result' && clearanceDecision.results.some(result => result.internalDecisionCode === decisionCheck.code)
  })?.description
}

const mapGmrDeclaration = (customsDeclarations, gvmDeclaration) => {
  const customsDeclaration = customsDeclarations.find(declaration => declaration.movementReferenceNumber?.toLowerCase() === gvmDeclaration.id?.toLowerCase())
  const isKnownMrn = customsDeclaration !== undefined
  const cdsStatus = isKnownMrn ? getCustomsDeclarationStatus(customsDeclaration.finalisation, customsDeclaration.clearanceDecision) : 'Unknown'
  const btmsDecision = isKnownMrn ? getBtmsDecision(customsDeclaration?.clearanceDecision) : 'Unknown'
  const knownMrnLink = isKnownMrn ? `${paths.SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${gvmDeclaration.id}` : undefined

  return {
    isKnownMrn,
    mrn: gvmDeclaration.id,
    knownMrnLink,
    cdsStatus,
    btmsDecision,
    finalState: customsDeclaration?.finalisation?.finalState
  }
}

const mapCustomsDeclarations = (
  customsDeclarations,
  goodsVehicleMovement
) => {
  const gmrCustoms = goodsVehicleMovement?.declarations?.customs?.map((custom) => {
    return mapGmrDeclaration(customsDeclarations, custom)
  }) || []

  const gmrTransits = goodsVehicleMovement?.declarations?.transits?.map((transit) => {
    return mapGmrDeclaration(customsDeclarations, transit)
  }) || []

  emitMetrics(gmrCustoms, gmrTransits)

  return (gmrCustoms).concat(gmrTransits)
}

const mrnCounter = (counter, custom, shouldBeCounted) => {
  if (custom.isKnownMrn === shouldBeCounted) {
    ++counter
  }

  return counter
}

const emitMetrics = (gmrCustoms, gmrTransits) => {
  const knownMrns = gmrCustoms.reduce((knownMrnsCount, custom) => mrnCounter(knownMrnsCount, custom, true), 0)
    + gmrTransits.reduce((knownMrnsCount, custom) => mrnCounter(knownMrnsCount, custom, true), 0)

  const unknownCustomsMrns = gmrCustoms.reduce((unknownMrnsCount, custom) => mrnCounter(unknownMrnsCount, custom, false), 0)

  if (knownMrns > 0) {
    metricsCounter(metricName.GMR_KNOWN_MRNS, knownMrns)
  }

  if (unknownCustomsMrns > 0) {
    metricsCounter(metricName.GMR_UNKNOWN_MRNS, unknownCustomsMrns)
  }
}

export const mapGoodsVehicleMovements = ({
  customsDeclarations,
  goodsVehicleMovements
}) => {
  const vehicleGoodsMovement = goodsVehicleMovements[0]?.gmr

  if (!vehicleGoodsMovement) {
    throw boom.badImplementation('Invalid GMR returned')
  }

  const linkedCustomsDeclarations = mapCustomsDeclarations(customsDeclarations, vehicleGoodsMovement)

  return {
    vehicleRegistrationNumber: vehicleGoodsMovement.vehicleRegistrationNumber,
    trailerRegistrationNumbers: vehicleGoodsMovement.trailerRegistrationNums,
    linkedCustomsDeclarations
  }
}
