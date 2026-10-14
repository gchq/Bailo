// Importing route files triggers registerPath() side-effects that populate the OpenAPI registries
import '../routes/v2/routes.js'
import '../routes/v3/routes.js'

import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

import log from '../services/log.js'
import { generateSwaggerSpec, generateV3SwaggerSpec } from '../services/specification.js'
import { defineScript } from './scriptHelper.js'

defineScript({
  name: 'generateOpenApiSpecs',
  description: 'Generate OpenAPI specification files for v2 and v3 APIs',
  connectToMongo: false,
  args: (yargs) =>
    yargs.option('outDir', {
      type: 'string',
      default: resolve(import.meta.dirname, '../../openapi-specs'),
      describe: 'Output directory for the generated spec files',
    }),
  run: async (args) => {
    mkdirSync(args.outDir, { recursive: true })

    const v2Spec = generateSwaggerSpec()
    const v3Spec = generateV3SwaggerSpec()

    writeFileSync(resolve(args.outDir, 'swagger-v2.json'), JSON.stringify(v2Spec, null, 2))
    writeFileSync(resolve(args.outDir, 'swagger-v3.json'), JSON.stringify(v3Spec, null, 2))

    log.info(`OpenAPI specs written to ${args.outDir}`)
  },
})
