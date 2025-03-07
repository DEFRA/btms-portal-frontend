import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'
import { createLogger } from '../utils/logger.js'
import { deserialise } from 'kitsu-core'
const logger = createLogger()
const apiResources = {
  CUSTOMS_DECLARATIONS: 'movements',
  PRE_NOTIFICATIONS: 'import-notifications'
}
const wreck = Wreck.defaults({})

const createCredentials = () => {
  const username = config.get('btmsApi.username')
  const pwd = config.get('btmsApi.password')
  return Buffer.from(`${username}:${pwd}`).toString('base64')
}

const invokeApi = async (url) => {
  const basicAuthCredentials = createCredentials()
  const { payload } = await wreck.get(`${config.get('btmsApi.baseUrl')}${url}`, {
    headers: { Authorization: `Basic ${basicAuthCredentials}` },
    json: 'strict'
  })
  return deserialise(payload)
}

const getCustomsDeclarationByMovementRefNum = async (movementReferenceNum) => {
  try {
    return await invokeApi(`/${apiResources.CUSTOMS_DECLARATIONS}/${movementReferenceNum}`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getPreNotificationByChedRef = async (chedRef) => {
  try {
    return await invokeApi(`/${apiResources.PRE_NOTIFICATIONS}/${chedRef}`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getPreNotificationByPartialChedRef = async (chedRef) => {
  try {
    return await invokeApi(`/${apiResources.PRE_NOTIFICATIONS}?filter=endsWith(id,%27${chedRef}%27)`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getPreNotificationsByChedRefs = async (chedRefs) => {
  try {
    const formattedChedRefs = chedRefs.map(ref => `%27${ref}%27`).join(',')
    return await invokeApi(`/${apiResources.PRE_NOTIFICATIONS}?filter=any(id,${formattedChedRefs})`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

const getCustomsDeclarationsByMovementRefNums = async (movementRefNumbers) => {
  try {
    const formattedMovementRefNumbers = movementRefNumbers.map(ref => `%27${ref}%27`).join(',')
    return await invokeApi(`/${apiResources.CUSTOMS_DECLARATIONS}?filter=any(id,${formattedMovementRefNumbers})`)
  } catch (err) {
    logger.error(err)
    return null
  }
}

export {
  getCustomsDeclarationByMovementRefNum,
  getCustomsDeclarationsByMovementRefNums,
  getPreNotificationsByChedRefs,
  getPreNotificationByChedRef,
  getPreNotificationByPartialChedRef
}
