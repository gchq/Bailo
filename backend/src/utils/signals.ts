import log from '../services/log.js'

process.on('SIGINT', () => {
  log.info('SIGINT signal received: Interrupted')
  process.exit(0)
})

export function registerSigTerminate(httpServer: any) {
  process.on('SIGTERM', () => {
    log.info('SIGTERM signal received: closing HTTP server')
    httpServer.close(() => {
      process.exit(0)
    })
  })
}
