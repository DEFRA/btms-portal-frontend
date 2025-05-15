import { format } from 'date-fns'
import {
  chedStatusDescriptions,
  documentCodeToAuthorityMapping,
  displayClosedChedStatuses,
  DATE_FORMAT
} from './model-constants.js'

const getDecision = (preNotification) => (
  ['VALIDATED', 'REJECTED'].includes(preNotification.status) &&
  preNotification.partTwo?.decision?.consignmentDecision
) || 'Decision not given'

const mapCommodity = (commodity, complementParameterSet) => {
  const commodityDesc = commodity.speciesName ||
    commodity.complementName

  const { keyDataPair } = complementParameterSet
    .find(({ complementID }) => complementID === commodity.complementId)

  const { data } = keyDataPair
    .find(({ key }) => key === 'number_animal' || key === 'netweight')

  return {
    complementId: commodity.complementId,
    commodityId: commodity.commodityId,
    commodityDesc,
    weightOrQuantity: data
  }
}

const mapPreNotification = (preNotification, documentCodes) => {
  const authorities = documentCodes
    .map((documentCode) => documentCodeToAuthorityMapping[documentCode])

  const status = chedStatusDescriptions[preNotification.status]
  const open = !displayClosedChedStatuses.includes(preNotification.status)
  const updated = format(new Date(preNotification.updatedSource), DATE_FORMAT)
  const decision = getDecision(preNotification)

  const { commodityComplement, complementParameterSet } = preNotification.partOne.commodities
  const commodities = commodityComplement
    .map((commodity) => mapCommodity(commodity, complementParameterSet))

  return {
    referenceNumber: preNotification.referenceNumber,
    status,
    open,
    updated,
    decision,
    authorities,
    commodities
  }
}

export const mapPreNotifications = (data) => {
  const declarationDocuments = [...new Set(data.customsDeclarations
    .flatMap((declaration) => declaration.clearanceRequest.commodities
      .flatMap((commodity) => commodity.documents)
    ))
  ]

  return data.importPreNotifications
    .map(({ importPreNotification }) => {
      const documentCodes = [...new Set(declarationDocuments
        .filter(({ documentReference }) =>
          documentReference.split('.').pop() === importPreNotification.referenceNumber.split('.').pop()
        )
        .map(({ documentCode }) => documentCode))
      ]

      return mapPreNotification(importPreNotification, documentCodes)
    })
}
