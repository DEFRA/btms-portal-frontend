import process from 'node:process'
import { createLogger } from './utils/logger.js'
import { startServer } from './utils/start-server.js'

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = createLogger()
  logger.error(error, 'Unhandled rejection')
  process.exitCode = 1
})
