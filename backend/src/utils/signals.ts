import logger from './logger.js'

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: Interrupted')
  process.exit(0)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSigTerminate(httpServer: any) {
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server')
    httpServer.close(() => {
      process.exit(0)
    })
  })
}
