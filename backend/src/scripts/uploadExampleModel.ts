import { fileFromPath } from 'formdata-node/file-from-path'
import fs from 'fs'
import open from 'open'
import { join } from 'path'
import { fileURLToPath } from 'url'

import Bailo from '../connectors/BailoClient.js'
import logger from '../utils/logger.js'

async function uploadExampleModel() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const api = new Bailo('http://localhost:8080/api/v1')

  const defaultSchema = await api.getDefaultSchema('UPLOAD')

  const metadata = JSON.parse(
    fs.readFileSync(join(__dirname, '../../../frontend/cypress/fixtures/minimal_metadata.json'), 'utf-8'),
  )
  metadata.schemaRef = defaultSchema.schema.reference

  const { uuid } = await api.postModel(
    await fileFromPath(join(__dirname, '../../../frontend/cypress/fixtures/minimal_code.zip')),
    await fileFromPath(join(__dirname, '../../../frontend/cypress/fixtures/minimal_binary.zip')),
    metadata,
  )

  logger.info({ uuid }, `Successfully uploaded model '${uuid}'`)
  await open(`http://localhost:8080/model/${uuid}`)

  return uuid
}

uploadExampleModel()
