import { format } from 'date-fns'
import {
  ANIMAL_PLANT_HEALTH_AGENCY,
  FOODS_NOT_ANIMAL_ORIGIN,
  ILLEGAL_UNREPORTED_UNREGULATED,
  PRODUCTS_OF_ANIMAL_ORIGIN,
  PLANT_HEALTH_SEEDS_INSPECTORATE,
  HORTICULTURAL_MARKETING_INSPECTORATE,
  chedStatusDescriptions,
  chedTypes,
  closedChedStatuses,
  DATE_FORMAT,
  checkStatusToOutcome
} from './model-constants.js'
import { config } from '../config/config.js'

const ipaffsUrlTemplate = config.get('ipaffs.urlTemplate')

const isCatchCertificateRequired = (keyDataPair) =>
  Boolean(
    keyDataPair
      .find(({ key, data }) =>
        key === 'is_catch_certificate_required' &&
        data === 'true'
      )
  )

const getChecks = (preNotification, complementParameterSet) => {
  const authorities = {
    [chedTypes.CHEDA]: ANIMAL_PLANT_HEALTH_AGENCY,
    [chedTypes.CHEDD]: FOODS_NOT_ANIMAL_ORIGIN,
    [chedTypes.CHEDP]: PRODUCTS_OF_ANIMAL_ORIGIN
  }

  const decision =
    (['VALIDATED', 'REJECTED'].includes(preNotification.status) &&
      preNotification.partTwo?.decision?.decision) ||
    'Decision not given'

  const needsCatchCertificate = (
    preNotification.importNotificationType === chedTypes.CHEDP &&
    isCatchCertificateRequired(complementParameterSet.keyDataPair)
  )

  const authority = authorities[preNotification.importNotificationType]

  return needsCatchCertificate
    ? [
        { decision, authority },
        { decision, authority: ILLEGAL_UNREPORTED_UNREGULATED }
      ]
    : [{ decision, authority }]
}

const getChedPPChecks = (preNotification, complementParameterSet) => {
  const { data } = complementParameterSet.keyDataPair
    .find(({ key }) => key === 'regulatory_authority')

  const authorities = data === 'JOINT'
    ? [
        PLANT_HEALTH_SEEDS_INSPECTORATE,
        HORTICULTURAL_MARKETING_INSPECTORATE
      ]
    : [data]

  const { commodityChecks, phsiAutoCleared, hmiAutoCleared } = preNotification.partTwo

  const { checks } = commodityChecks.find(({ uniqueComplementId }) => {
    return uniqueComplementId === complementParameterSet.uniqueComplementId
  })

  return authorities.map((authority) => {
    if (!['VALIDATED', 'REJECTED', 'PARTIALLY_REJECTED'].includes(preNotification.status)) {
      return { authority, decision: 'Decision not given' }
    }

    if (
      (authority === PLANT_HEALTH_SEEDS_INSPECTORATE && phsiAutoCleared) ||
      (authority === HORTICULTURAL_MARKETING_INSPECTORATE && hmiAutoCleared)
    ) {
      return { authority, decision: 'Auto cleared' }
    }

    const outcomePrecedence = {
      'Non compliant': 1,
      Hold: 2,
      Compliant: 3
    }

    const decision = checks.reduce((finalOutcome, check) => {
      if (check.type.startsWith(authority)) {
        const outcome = checkStatusToOutcome[check.status]
        return outcomePrecedence[outcome] < outcomePrecedence[finalOutcome]
          ? outcome
          : finalOutcome
      }

      return finalOutcome
    }, 'Compliant')

    return { authority, decision }
  })
}

const mapCommodity = (commodityComplement, preNotification) => {
  const { complementParameterSets } = preNotification.partOne.commodities
  const { importNotificationType } = preNotification
  const complementParameterSet = complementParameterSets
    .find(({ complementId }) => complementId === commodityComplement.complementId)

  const commodityDesc = commodityComplement.speciesName ||
    commodityComplement.commodityDescription ||
    commodityComplement.complementName

  const { data } = complementParameterSet.keyDataPair
    .find(({ key }) => key === 'number_animal' || key === 'netweight')

  const checks = importNotificationType === chedTypes.CHEDPP
    ? getChedPPChecks(preNotification, complementParameterSet)
    : getChecks(preNotification, complementParameterSet)

  return {
    id: complementParameterSet.uniqueComplementId,
    complementId: commodityComplement.complementId,
    commodityId: commodityComplement.commodityId,
    commodityDesc,
    weightOrQuantity: data,
    checks
  }
}

const mapPreNotification = (preNotification) => {
  const status = chedStatusDescriptions[preNotification.status]
  const open = !closedChedStatuses.includes(preNotification.status)
  const updated = format(new Date(preNotification.updatedSource), DATE_FORMAT)

  const { commodityComplements } = preNotification.partOne.commodities
  const commodities = commodityComplements.map((commodityComplement) =>
    mapCommodity(commodityComplement, preNotification)
  )

  const ipaffsUrl = ipaffsUrlTemplate.replace('CHED_REFERENCE', preNotification.referenceNumber)

  return {
    referenceNumber: preNotification.referenceNumber,
    status,
    open,
    updated,
    commodities,
    ipaffsUrl
  }
}

export const mapPreNotifications = ({ importPreNotifications }) => importPreNotifications
  .map(({ importPreNotification }) => mapPreNotification(importPreNotification))
