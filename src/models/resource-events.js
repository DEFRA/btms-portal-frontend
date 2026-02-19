import { format } from 'date-fns'
import { getCustomsDeclarationStatus } from './customs-declarations.js'
import {
  checkCodeToAuthorityMapping,
  checkCodeToAuthorityNameMapping,
  checkCodeToDocumentCodeMapping,
  decisionCodeDescriptions,
  internalDecisionCodeDescriptions,
  NO_MATCH_DECISION_CODE
} from './model-constants.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

const RESOURCE_TYPE = {
  IMPORT_PRE_NOTIFICATION: 'ImportPreNotification',
  CUSTOMS_DECLARATION: 'CustomsDeclaration',
  PROCESSING_ERROR: 'ProcessingError'
}

const SUB_RESOURCE_TYPE = {
  CLEARANCE_REQUEST: 'ClearanceRequest',
  CLEARANCE_DECISION: 'ClearanceDecision',
  EXTERNAL_ERROR: 'ExternalError',
  FINALISATION: 'Finalisation'
}

const EVENT_SOURCE_DESCRIPTIONS = {
  IPAFFS_TO_BTMS: 'IPAFFS to BTMS',
  CDS_TO_BTMS: 'CDS to BTMS',
  BTMS_TO_CDS: 'BTMS to CDS'
}

const EVENT_SOURCE = {
  IMPORT_PRE_NOTIFICATION: EVENT_SOURCE_DESCRIPTIONS.IPAFFS_TO_BTMS,
  CLEARANCE_REQUEST: EVENT_SOURCE_DESCRIPTIONS.CDS_TO_BTMS,
  DECISION_NOTIFICATION: EVENT_SOURCE_DESCRIPTIONS.BTMS_TO_CDS,
  FINALISATION: EVENT_SOURCE_DESCRIPTIONS.CDS_TO_BTMS,
  CDS_ERROR: EVENT_SOURCE_DESCRIPTIONS.CDS_TO_BTMS,
  PROCESSING_ERROR: EVENT_SOURCE_DESCRIPTIONS.BTMS_TO_CDS
}

const EVENT_TYPE = {
  BTMS_DECISION: 'BtmsDecision',
  BTMS_ERROR: 'BtmsError',
  CDS_DECISION_REQUEST: 'CdsDecisionRequest',
  CDS_ERROR: 'CdsError',
  CDS_FINALISATION: 'CdsFinalisation',
  CHED: 'Ched'
}

const DECISION = {
  H01: `Hold - ${decisionCodeDescriptions['H01']}`,
  H02: `Hold - ${decisionCodeDescriptions['H02']}`,
  C01: `Release - ${decisionCodeDescriptions['C01']}`,
  C02: `Release - ${decisionCodeDescriptions['C02']}`,
  C03: `Release - ${decisionCodeDescriptions['C03']}`,
  C05: `Release - ${decisionCodeDescriptions['C05']}`,
  C06: `Release - ${decisionCodeDescriptions['C06']}`,
  C07: `Release - ${decisionCodeDescriptions['C07']}`,
  C08: `Release - ${decisionCodeDescriptions['C08']}`,
  N01: `Refusal - ${decisionCodeDescriptions['N01']}`,
  N02: `Refusal - ${decisionCodeDescriptions['N02']}`,
  N03: `Refusal - ${decisionCodeDescriptions['N03']}`,
  N04: `Refusal - ${decisionCodeDescriptions['N04']}`,
  N05: `Refusal - ${decisionCodeDescriptions['N05']}`,
  N06: `Refusal - ${decisionCodeDescriptions['N06']}`,
  N07: `Refusal - ${decisionCodeDescriptions['N07']}`,
  X00: `${decisionCodeDescriptions['X00']}`,
  E01: `Data Error - ${decisionCodeDescriptions['E01']}`,
  E02: `Data Error - ${decisionCodeDescriptions['E02']}`,
  E03: `Data Error - ${decisionCodeDescriptions['E03']}`
}

const timeFormat = 'dd MMMM yyyy, HH:mm:ss'

const getDocRef = (commodity, check) => {
  const docCodes = checkCodeToDocumentCodeMapping[check.checkCode]

  let docRef

  docCodes?.some(docCode => {
    const document = commodity.documents?.find(commodityDocument => commodityDocument.documentCode === docCode)
    docRef = document?.documentReference
    return true
  })

  return docRef
}

const mapClearanceRequestResourceEvent = (resourceMessage) => {
  const commodities = resourceMessage.resource?.clearanceRequest?.commodities?.map(commodity => {
    const checks = commodity.checks?.map(check => {
      const docRef = getDocRef(commodity, check)

      return {
        chedReference: docRef,
        checkCode: check.checkCode,
        authority: checkCodeToAuthorityNameMapping[check.checkCode]
          || checkCodeToAuthorityMapping[check.checkCode]
      }
    })

    return {
      itemNumber: commodity.itemNumber,
      description: commodity.goodsDescription,
      commodityCode: commodity.taricCommodityCode,
      checks
    }
  })

  return {
    eventType: EVENT_TYPE.CDS_DECISION_REQUEST,
    eventTitle: 'CDS decision request',
    source: EVENT_SOURCE.CLEARANCE_REQUEST,
    version: resourceMessage.resource?.clearanceRequest?.externalVersion,
    created: resourceMessage.resource?.clearanceRequest?.messageSentAt ? format(new Date(resourceMessage.resource.clearanceRequest.messageSentAt), timeFormat) : undefined,
    commodities
  }
}

const mapDecisionNotificationResourceEvent = (resourceMessage) => {
  const commodities = resourceMessage.resource?.clearanceDecision?.items?.map(item => {
    const commodity = resourceMessage.resource?.clearanceRequest?.commodities?.find(clearanceRequestCommodity => clearanceRequestCommodity.itemNumber === item.itemNumber)
    const itemResults = resourceMessage.resource?.clearanceDecision?.results?.filter(result => result.itemNumber === commodity.itemNumber) || []

    const decisions = itemResults.map(result => {
      let decision = DECISION[result.decisionCode]

      if (result.decisionCode === NO_MATCH_DECISION_CODE && internalDecisionCodeDescriptions[result.internalDecisionCode]) {
        decision = internalDecisionCodeDescriptions[result.internalDecisionCode]
      }

      return {
        chedReference: result.documentReference,
        checkCode: result.checkCode,
        authority: checkCodeToAuthorityNameMapping[result.checkCode]
          || checkCodeToAuthorityMapping[result.checkCode],
        decisionCode: result.decisionCode,
        decision
      }
    })

    return {
      itemNumber: item.itemNumber,
      description: commodity?.goodsDescription,
      commodityCode: commodity?.taricCommodityCode,
      decisions
    }
  })

  return {
    eventType: EVENT_TYPE.BTMS_DECISION,
    eventTitle: 'BTMS decision',
    source: EVENT_SOURCE.DECISION_NOTIFICATION,
    status: getCustomsDeclarationStatus(resourceMessage.resource?.finalisation, resourceMessage.resource?.clearanceDecision),
    finalState: resourceMessage.resource?.finalisation?.finalState,
    version: resourceMessage.resource?.clearanceDecision?.decisionNumber,
    created: resourceMessage.resource?.clearanceDecision?.created ? format(new Date(resourceMessage.resource.clearanceDecision.created), timeFormat) : undefined,
    commodities
  }
}

const mapFinalisationResourceEvent = (resourceMessage) => {
  return {
    eventType: EVENT_TYPE.CDS_FINALISATION,
    eventTitle: 'CDS finalisation',
    source: EVENT_SOURCE.FINALISATION,
    status: getCustomsDeclarationStatus(resourceMessage.resource?.finalisation, resourceMessage.resource?.clearanceDecision),
    finalState: resourceMessage.resource?.finalisation?.finalState,
    version: resourceMessage.resource?.finalisation?.externalVersion,
    created: resourceMessage.resource?.finalisation?.messageSentAt ? format(new Date(resourceMessage.resource.finalisation.messageSentAt), timeFormat) : undefined
  }
}

const mapCdsErrorResourceEvent = (resourceMessage) => {
  const lastInboundError = resourceMessage.resource?.externalErrors?.at(-1)

  const errors = lastInboundError?.errors?.map(error => {
    return {
      errorCode: error.code,
      errorMessage: error.message,
      created: lastInboundError?.messageSentAt ? format(new Date(lastInboundError.messageSentAt), timeFormat) : undefined
    }
  })

  return {
    eventType: EVENT_TYPE.CDS_ERROR,
    eventTitle: 'CDS processing error',
    source: EVENT_SOURCE.CDS_ERROR,
    errors,
    created: lastInboundError?.messageSentAt ? format(new Date(lastInboundError?.messageSentAt), timeFormat) : undefined
  }
}

const sortProcessingErrorCreatedDescending = (a, b) => {
  const aCreated = new Date(a?.created).getTime()
  const bCreated = new Date(b?.created).getTime()

  return bCreated - aCreated
}

const mapProcessingErrorResourceEvent = (mrn, resourceMessage) => {
  const latestProcessingError = resourceMessage.resource?.processingErrors?.sort((a, b) => sortProcessingErrorCreatedDescending(a, b))[0]

  let errors = []

  if (latestProcessingError) {
    errors = latestProcessingError.errors?.map(error => {
      let errorMessage = mrn ? error.message?.replace(mrn, `<strong class="btms-error-highlight">${mrn}</strong>`) : error.message
      errorMessage = errorMessage.replace(`EntryVersionNumber ${latestProcessingError.externalVersion}`, `<strong class="btms-error-highlight">EntryVersionNumber ${latestProcessingError.externalVersion}</strong>`)
      errorMessage = errorMessage.replace(`version number ${latestProcessingError.externalVersion}`, `<strong class="btms-error-highlight">version number ${latestProcessingError.externalVersion}</strong>`)

      return {
        errorCode: error.code,
        errorMessage,
        created: latestProcessingError.created ? format(new Date(latestProcessingError.created), timeFormat) : undefined
      }
    })
  }

  return {
    eventType: EVENT_TYPE.BTMS_ERROR,
    eventTitle: 'BTMS processing error',
    source: EVENT_SOURCE.PROCESSING_ERROR,
    errors,
    created: latestProcessingError?.created ? format(new Date(latestProcessingError.created), timeFormat) : undefined
  }
}

const mapImportPreNotificationResourceEvent = (resourceMessage) => {
  return {
    eventType: EVENT_TYPE.CHED,
    eventTitle: resourceMessage.resource?.importPreNotification?.referenceNumber,
    source: EVENT_SOURCE.IMPORT_PRE_NOTIFICATION,
    status: resourceMessage.resource?.importPreNotification?.status,
    decision: resourceMessage.resource?.importPreNotification?.decisionDate ? resourceMessage.resource?.importPreNotification?.partTwo?.decision?.decision : undefined,
    created: resourceMessage.resource?.importPreNotification?.updatedSource ? format(new Date(resourceMessage.resource.importPreNotification.updatedSource), timeFormat) : undefined
  }
}

export const mapResourceEvents = (mrn, resourceEvents) => {
  const mappedResourceEvents = []

  resourceEvents.forEach((resourceEvent) => {
    try {
      const resourceMessage = JSON.parse(resourceEvent.message)

      if (resourceEvent.resourceType === RESOURCE_TYPE.CUSTOMS_DECLARATION) {
        switch (resourceEvent.subResourceType) {
          case (SUB_RESOURCE_TYPE.CLEARANCE_REQUEST):
            mappedResourceEvents.push(mapClearanceRequestResourceEvent(resourceMessage))
            break
          case (SUB_RESOURCE_TYPE.CLEARANCE_DECISION):
            mappedResourceEvents.push(mapDecisionNotificationResourceEvent(resourceMessage))
            break
          case (SUB_RESOURCE_TYPE.FINALISATION):
            mappedResourceEvents.push(mapFinalisationResourceEvent(resourceMessage))
            break
          case (SUB_RESOURCE_TYPE.EXTERNAL_ERROR):
            mappedResourceEvents.push(mapCdsErrorResourceEvent(resourceMessage))
            break
          default:
            // Do nothing
        }
      }

      if (resourceEvent.resourceType === RESOURCE_TYPE.PROCESSING_ERROR) {
        mappedResourceEvents.push(mapProcessingErrorResourceEvent(mrn, resourceMessage))
      }

      if (resourceEvent.resourceType === RESOURCE_TYPE.IMPORT_PRE_NOTIFICATION) {
        mappedResourceEvents.push(mapImportPreNotificationResourceEvent(resourceMessage))
      }
    } catch (error) {
      logger.warn(`Unable to parse and map timeline resource event for MNR ${mrn}. ERROR: ${error.message}`)
    }
  })

  return mappedResourceEvents
}
