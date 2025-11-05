import './utils/signals.js'
import './instrumentation.js'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import shelljs from 'shelljs'
import { z } from 'zod'

import { ensureBucketExists } from './clients/s3.js'
import log from './services/log.js'
import { addDefaultReviewRoles } from './services/review.js'
import { addDefaultSchemas } from './services/schema.js'
import config from './utils/config.js'
import { connectToMongoose, runMigrations } from './utils/database.js'
import { ConfigurationError } from './utils/error.js'
import { registerSigTerminate } from './utils/signals.js'

// Update certificates based on mount
shelljs.exec('update-ca-certificates', { fatal: false, async: false })

// Let Zod types have OpenAPI attributes
extendZodWithOpenApi(z)

// technically, we do need to wait for this, but it's so quick
// that nobody should notice unless they want to upload an image
// within the first few milliseconds of the _first_ time it's run
if (config.s3.automaticallyCreateBuckets) {
  ensureBucketExists(config.s3.buckets.uploads)
  ensureBucketExists(config.s3.buckets.registry)
}

// check that the soft delete prefix for the registry will not conflict
if (!config.registry.softDeletePrefix.match(/[^a-z 0-9]/)) {
  throw ConfigurationError(
    'Soft deletion config string must not allow users to bypass registry authentication. Please use a non alphanumeric character eg an underscore.',
    { softDeletePrefix: config.registry.softDeletePrefix },
  )
}

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily add default dynamic review roles
await addDefaultReviewRoles()

// lazily add default schemas
await addDefaultSchemas()

const { server } = await import('./routes.js')
const httpServer = server.listen(config.api.port, () => {
  log.info(config.api.port, 'Listening on port')
})
// Set header timeout to 24H
httpServer.headersTimeout = 86400000

registerSigTerminate(httpServer)
