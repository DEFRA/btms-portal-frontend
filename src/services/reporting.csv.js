import wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { authorization } from './reporting-auth.js'
import { getFromAndTo } from '../utils/dates.js'
import {
  NO_MATCH_CSV,
  MANUAL_RELEASE_CSV,
  LEVEL_MATCHING_CSV
} from '../routes/route-constants.js'

const { baseUrl } = config.get('btmsReportingApi')

const paths = {
  [NO_MATCH_CSV]: 'matches',
  [MANUAL_RELEASE_CSV]: 'releases',
  [LEVEL_MATCHING_CSV]: 'matches'
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
    const res = await wreck.request(
      'get',
      `${baseUrl}/${apiPath}/data?${query}`,
      {
        headers: { authorization, useV2 }
      }
    )

    return res
  } catch (error) {
    request.logger.setBindings({ error })
    throw error
  }
}
