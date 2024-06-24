import './utils/signals.js'
import './instrumentation.js'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import shelljs from 'shelljs'
import { z } from 'zod'

import { ensureBucketExists } from './clients/s3.js'
import log from './services/log.js'
import { addDefaultSchemas } from './services/schema.js'
import config from './utils/config.js'
import { connectToMongoose, runMigrations } from './utils/database.js'
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

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily add default schemas
addDefaultSchemas()

const { server } = await import('./routes.js')
const httpServer = server.listen(config.api.port, () => {
  log.info('Listening on port', config.api.port)
})
// Set header timeout to 24H
httpServer.headersTimeout = 86400000

registerSigTerminate(httpServer)
