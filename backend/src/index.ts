import './instrumentation.js'

import fs from 'fs'
import https from 'https'
import shelljs from 'shelljs'

import { ensureBucketExists } from './clients/s3.js'
import log from './services/log.js'
import { addDefaultReviewRoles } from './services/review.js'
import { startScheduler } from './services/schedule/scheduler.js'
import { addDefaultSchemas } from './services/schema.js'
import config from './utils/config.js'
import { connectToMongoose, runMigrations } from './utils/database.js'
import { registerSigTerminate } from './utils/signals.js'
// Update certificates based on mount
shelljs.exec('update-ca-certificates', { fatal: false, async: false })

// technically, we do need to wait for this, but it's so quick
// that nobody should notice unless they want to upload an image
// within the first few milliseconds of the _first_ time it's run
if (config.s3.automaticallyCreateBuckets) {
  ensureBucketExists(config.s3.buckets.uploads)
  ensureBucketExists(config.s3.buckets.registry)
}

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily add default dynamic review roles
await addDefaultReviewRoles()

// lazily add default schemas
await addDefaultSchemas()

// Start the scheduler
await startScheduler([])

const { server } = await import('./routes.js')
const httpServer = server.listen(config.api.port, () => {
  log.info(config.api.port, 'Listening on port')
})
// Set header timeout to 24H
httpServer.headersTimeout = 86400000

const internalServer = https.createServer(
  {
    key: fs.readFileSync(config.app.privateKey),
    cert: fs.readFileSync(config.app.publicKey),
    ca: fs.readFileSync(config.app.publicKey),
    requestCert: true,
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
  server,
)

internalServer.listen(config.api.internalPort, () => {
  log.info(config.api.internalPort, 'Internal HTTPS (mTLS) listening on port')
})

internalServer.headersTimeout = 86_400_000

registerSigTerminate(httpServer)
registerSigTerminate(internalServer)

registerSigTerminate(httpServer)
