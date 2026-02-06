import boom from '@hapi/boom'
import { getCustomsDeclarationStatus } from './customs-declarations.js'
import { ORDERED_CDS_STATUSES,ORDERED_CLEARANCE_DECISIONS } from './model-constants.js'
import { paths, queryStringParams } from '../routes/route-constants.js'
import { format } from 'date-fns'

const MAX_VRN_TRN_SEARCH_RESULTS = 5

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

const incrementCounter = (counter, gmrDeclaration, shouldBeCounted) => {
  if (gmrDeclaration.isKnownMrn === shouldBeCounted) {
    ++counter
  }

  return counter
}

const getStatusRank = (status) => {
  const displayOrder = ORDERED_CDS_STATUSES.indexOf(status)
  return displayOrder > -1 ? displayOrder :  Number.MAX_SAFE_INTEGER
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

  return {
    mrnCounts: {
      known: gmrCustoms.reduce((knownMrnsCount, custom) => incrementCounter(knownMrnsCount, custom, true), 0),
      unknown: gmrCustoms.reduce((unknownMrnsCount, custom) => incrementCounter(unknownMrnsCount, custom, false), 0)
    },
    customsDeclarations: (gmrCustoms).concat(gmrTransits).sort((a, b) => getStatusRank(a.cdsStatus) - getStatusRank(b.cdsStatus))
  }
}

const sortArrivesAtDescending = (a, b) => {
  if (!a) { return -1 }
  if (!b) { return 1 }

  const aArrivalTime = new Date(a).getTime()
  const bArrivalTime = new Date(b).getTime()

  return bArrivalTime - aArrivalTime
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
    linkedCustomsDeclarations: linkedCustomsDeclarations.customsDeclarations,
    mrnCounts: linkedCustomsDeclarations.mrnCounts
  }
}

export const mapVrnTrnGoodsVehicleMovements = ({
  goodsVehicleMovements
}) => {
  const linkedGmrs = goodsVehicleMovements
    .filter(gvm => gvm.gmr)
    .sort((a, b) => sortArrivesAtDescending(a.gmr.actualCrossing?.arrivesAt, b.gmr.actualCrossing?.arrivesAt))
    .map(gvm => {
      const transits = gvm.gmr.declarations.transits.map(transit => transit.id)
      const customs = gvm.gmr.declarations.customs.map(custom => custom.id)
      const linkedDeclarations = new Set([...transits, ...customs]).size

      return {
        gmrId: gvm.gmr.id,
        gmrLink: `${paths.GMR_SEARCH_RESULT}?${queryStringParams.SEARCH_TERM}=${gvm.gmr.id}`,
        linkedDeclarations,
        arrivalDate: gvm.gmr.actualCrossing?.arrivesAt ? format(new Date(gvm.gmr.actualCrossing?.arrivesAt), 'dd MMMM yyyy, HH:mm') : 'Not arrived'
      }
    })

  return linkedGmrs.slice(0, MAX_VRN_TRN_SEARCH_RESULTS)
}
