import './instrumentation.js'

import shelljs from 'shelljs'

import { ensureBucketExists } from './clients/s3.js'
import log from './services/log.js'
import { addDefaultReviewRoles } from './services/review.js'
import { registerLifecycleReviewJob, startScheduler } from './services/schedule/scheduler.js'
import { addDefaultSchemas } from './services/schema.js'
import config from './utils/config.js'
import { connectToMongoose, runMigrations } from './utils/database.js'
import { registerSigTerminate } from './utils/signals.js'
// Update certificates based on mount
shelljs.exec('update-ca-certificates', { fatal: false, async: false })

if (config.s3.automaticallyCreateBuckets) {
  const bucketNames = [config.s3.buckets.uploads, config.s3.buckets.registry]
  await Promise.all(bucketNames.map((bucket) => ensureBucketExists(bucket)))
}

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily add default dynamic review roles
await addDefaultReviewRoles()

// lazily add default schemas
await addDefaultSchemas()

// Start the scheduler
await startScheduler([registerLifecycleReviewJob])

const { server } = await import('./routes.js')
const httpServer = server.listen(config.api.port, () => {
  log.info(config.api.port, 'Listening on port')
})
// Set header timeout to 24H
httpServer.headersTimeout = 86400000

registerSigTerminate(httpServer)
