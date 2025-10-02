import { config } from '../config/config.js'

const { password, username } = config.get('btmsReportingApi')
const token = Buffer.from(`${username}:${password}`).toString('base64')

export const authorization = `Basic ${token}`
