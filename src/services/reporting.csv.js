import { config } from '../config/config.js'
import { ApiClient } from '../utils/api.js'
import { getFromAndTo } from '../utils/dates.js'
import {
  NO_MATCH_CSV,
  MANUAL_RELEASE_CSV,
  LEVEL_MATCHING_CSV,
  CUSTOMS_DECLARATIONS_CSV,
  IPAFFS_CHEDS_CSV,
  TRACES_CHEDS_CSV
} from '../routes/route-constants.js'

const reportingApiClient = new ApiClient(config.get('btmsReportingApi'))

const paths = {
  [NO_MATCH_CSV]: 'matches/data',
  [MANUAL_RELEASE_CSV]: 'releases/data',
  [LEVEL_MATCHING_CSV]: 'matches/data',
  [CUSTOMS_DECLARATIONS_CSV]: 'extracts/customs-declarations',
  [IPAFFS_CHEDS_CSV]: 'extracts/ipaffs-cheds',
  [TRACES_CHEDS_CSV]: 'extracts/traces-cheds'
}
const queryParams = {
  [NO_MATCH_CSV]: { match: false },
  [MANUAL_RELEASE_CSV]: { releaseType: 'Manual' },
  [LEVEL_MATCHING_CSV]: { match: false }
}

export const getReportingCsv = async (request, useV2 = false) => {
  const { startDate, endDate } = request.query
  const params = queryParams[request.params.name]
  const [from, to] = getFromAndTo(startDate, endDate)

  const query = new URLSearchParams({ from, to, ...params })
  const apiPath = paths[request.params.name]

  try {
    const res = await reportingApiClient.getStream(
      `${apiPath}?${query}`,
      { useV2 }
    )

    return res
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
