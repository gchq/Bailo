// Importing route files triggers registerPath() side-effects that populate the OpenAPI registries
import '../routes/v2/routes.js'
import '../routes/v3/routes.js'

import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

import log from '../services/log.js'
import { generateSwaggerSpec, generateV3SwaggerSpec } from '../services/specification.js'

async function main() {
  const outDir = process.argv[2] || resolve(import.meta.dirname, '../../openapi-specs')

  mkdirSync(outDir, { recursive: true })

  const v2Spec = generateSwaggerSpec()
  const v3Spec = generateV3SwaggerSpec()

  writeFileSync(resolve(outDir, 'swagger-v2.json'), JSON.stringify(v2Spec, null, 2))
  writeFileSync(resolve(outDir, 'swagger-v3.json'), JSON.stringify(v3Spec, null, 2))

  log.info(`OpenAPI specs written to ${outDir}`)
}
main()
