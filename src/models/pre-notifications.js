import { format } from 'date-fns'
import {
  ANIMAL_PLANT_HEALTH_AGENCY,
  FOODS_NOT_ANIMAL_ORIGIN,
  PRODUCTS_OF_ANIMAL_ORIGIN,
  PLANT_HEALTH_SEEDS_INSPECTORATE,
  HORTICULTURAL_MARKETING_INSPECTORATE,
  chedStatusDescriptions,
  chedTypes,
  closedChedStatuses,
  DATE_FORMAT
} from './model-constants.js'
import { config } from '../config/config.js'

const ipaffsUrlTemplate = config.get('ipaffs.urlTemplate')

const getDecision = (preNotification) => (
  ['VALIDATED', 'REJECTED'].includes(preNotification.status) &&
  preNotification.partTwo?.decision?.decision
) || 'Decision not given'

export const getAuthorities = (importNotificationType, complementParameterSet) => {
  if (importNotificationType === chedTypes.CHEDA) {
    return [ANIMAL_PLANT_HEALTH_AGENCY]
  }
  if (importNotificationType === chedTypes.CHEDD) {
    return [FOODS_NOT_ANIMAL_ORIGIN]
  }
  if (importNotificationType === chedTypes.CHEDP) {
    return [PRODUCTS_OF_ANIMAL_ORIGIN]
  }

  const { data } = complementParameterSet.keyDataPair
    .find(({ key }) => key === 'regulatory_authority')

  const chedppAuthorities = data === 'JOINT'
    ? [
        PLANT_HEALTH_SEEDS_INSPECTORATE,
        HORTICULTURAL_MARKETING_INSPECTORATE
      ]
    : [data]

  return chedppAuthorities
}

const mapCommodity = (
  commodityComplement,
  complementParameterSets,
  importNotificationType
) => {
  const complementParameterSet = complementParameterSets
    .find(({ complementId }) => complementId === commodityComplement.complementId)

  const commodityDesc = commodityComplement.speciesName ||
    commodityComplement.commodityDescription ||
    commodityComplement.complementName

  const { data } = complementParameterSet.keyDataPair
    .find(({ key }) => key === 'number_animal' || key === 'netweight')

  const authorities = getAuthorities(importNotificationType, complementParameterSet)

  return {
    id: complementParameterSet.uniqueComplementId,
    complementId: commodityComplement.complementId,
    commodityId: commodityComplement.commodityId,
    commodityDesc,
    weightOrQuantity: data,
    authorities
  }
}

const mapPreNotification = (preNotification) => {
  const status = chedStatusDescriptions[preNotification.status]
  const open = !closedChedStatuses.includes(preNotification.status)
  const updated = format(new Date(preNotification.updatedSource), DATE_FORMAT)
  const decision = getDecision(preNotification)

  const { commodityComplements, complementParameterSets } = preNotification.partOne.commodities
  const { importNotificationType } = preNotification

  const commodities = commodityComplements.map((commodityComplement) =>
    mapCommodity(
      commodityComplement,
      complementParameterSets,
      importNotificationType
    )
  )

  const ipaffsUrl = ipaffsUrlTemplate.replace('CHED_REFERENCE', preNotification.referenceNumber)

  return {
    referenceNumber: preNotification.referenceNumber,
    status,
    open,
    updated,
    decision,
    commodities,
    ipaffsUrl
  }
}

export const mapPreNotifications = ({ importPreNotifications }) => importPreNotifications
  .map(({ importPreNotification }) => mapPreNotification(importPreNotification))
