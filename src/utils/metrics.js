import {
  createMetricsLogger,
  Unit,
  StorageResolution
} from 'aws-embedded-metrics'

import { config } from '../config/config.js'
import { createLogger } from './logger.js'
import { searchKeys } from '../services/search-patterns.js'

const logger = createLogger()

export const METRIC_NAMES = {
  MRN: 'search.mrn',
  CHED_ID: 'search.chedId',
  DUCR: 'search.ducr',
  GMR_ID: 'search.gmrId',
  VRN_TRN: 'search.vrn.trn',
  SIGNIN_ENTRA_ID: 'signIn.entraId',
  SIGNIN_DEFRA_ID: 'signIn.defraId',
  GMR_NOT_FOUND: 'gmr.search.not.found',
  GVM_KNOWN_MRNS: 'gvm.mrns.known',
  GVM_UNKNOWN_MRNS: 'gvm.mrns.unknown',
  VRN_TRN_NOT_FOUND: 'vrn.trn.search.not.found',
}

const SEARCH_TYPE_METRIC_NAME_MAPPINGS = {
  [searchKeys.MRN]: METRIC_NAMES.MRN,
  [searchKeys.CHED_ID]: METRIC_NAMES.CHED_ID,
  [searchKeys.CDS_CHED_ID]: METRIC_NAMES.CHED_ID,
  [searchKeys.PARTIAL_CHED]: METRIC_NAMES.CHED_ID,
  [searchKeys.CHED_LAST_SEVEN_DIGITS]: METRIC_NAMES.CHED_ID,
  [searchKeys.DUCR]: METRIC_NAMES.DUCR,
  [searchKeys.GMR_ID]: METRIC_NAMES.GMR_ID,
  [searchKeys.VRN_TRN]: METRIC_NAMES.VRN_TRN
}

export const getMetricNameBySearchType = (searchType) => {
  const metricName = SEARCH_TYPE_METRIC_NAME_MAPPINGS[searchType]

  if (!metricName) {
    logger.warn(`Metric name not found for search type ${searchType}`)
  }

  return metricName
}

/**
 * Aws embedded metrics wrapper
 * @param {string} metricName
 * @param {number} value
 * @returns {Promise<void>}
 */
export async function metricsCounter(metricName, value = 1) {
  const isMetricsEnabled = config.get('isMetricsEnabled')

  if (!isMetricsEnabled) {
    return
  }

  try {
    const metricsLogger = createMetricsLogger()
    metricsLogger.putMetric(
      metricName,
      value,
      Unit.Count,
      StorageResolution.Standard
    )
    await metricsLogger.flush()
  } catch (error) {
    logger.error(error, error.message)
  }
}
