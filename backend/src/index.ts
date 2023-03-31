import config from './utils/config.js'
import './utils/signals.js'
import { registerSigTerminate } from './utils/signals.js'
import { ensureBucketExists } from './utils/minio.js'
import { createModelIndexes } from './models/Model.js'
import processUploads from './processors/processUploads.js'
import processDeployments from './processors/processDeployments.js'
import { server } from './routes.js'

import { runMigrations, connectToMongoose } from './utils/database.js'
import shelljs from 'shelljs'
import { createSchemaIndexes } from './models/Schema.js'

// Update certificates based on mount
shelljs.exec('update-ca-certificates', { fatal: false, async: false })

// technically, we do need to wait for this, but it's so quick
// that nobody should notice unless they want to upload an image
// within the first few milliseconds of the _first_ time it's run
if (config.minio.automaticallyCreateBuckets) {
  ensureBucketExists(config.minio.buckets.uploads)
  ensureBucketExists(config.minio.buckets.registry)
}

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily create indexes for full text search
createModelIndexes()
createSchemaIndexes()

await Promise.all([processUploads(), processDeployments()])

const httpServer = server.listen(config.api.port, () => {
  console.log('Listening on port', config.api.port)
})

registerSigTerminate(httpServer)
