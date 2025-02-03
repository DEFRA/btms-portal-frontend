import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'
import { deserialise } from 'kitsu-core'
const logger = createLogger()
const createCredentials = () => {
  const username = config.get('btmsApi.username')
  const pwd = config.get('btmsApi.password')
  return Buffer.from(`${username}:${pwd}`).toString('base64')
}

const invokeApi = async (url) => {
  const basicAuthCredentials = createCredentials()
  const { /* res, */ payload } = await Wreck.get(`${config.get('btmsApi.baseUrl')}${url}`, {
    headers: { Authorization: `Basic ${basicAuthCredentials}` },
    json: 'strict'
  })
  return deserialise(payload)
}

const getCustomsDeclarationByMovementRefNum = async (movementReferenceNum) => {
  try {
    return await invokeApi(`/movements/${movementReferenceNum}`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getPreNotificationByChedRef = async (chedRef) => {
  try {
    return await invokeApi(`/import-notifications/${chedRef}`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getPreNotificationsByChedRefs = async (chedRefs) => {
  try {
    // TODO: check if the kitsu-core npm package can be used to create the query string
    const formattedChedRefs = chedRefs.map(ref => `%27${ref}%27`).join(',')
    return await invokeApi(`/import-notifications?filter=any(id,${formattedChedRefs})`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getCustomsDeclarationsByMovementRefNums = async (movementRefNumbers) => {
  try {
    // TODO: check if the kitsu-core npm package can be used to create the query string
    const formattedMovementRefNumbers = movementRefNumbers.map(ref => `%27${ref}%27`).join(',')
    return await invokeApi(`/movements?filter=any(id,${formattedMovementRefNumbers})`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

export {
  getCustomsDeclarationByMovementRefNum,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationsByChedRefs,
  getPreNotificationByChedRef
}
