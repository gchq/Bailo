import { join } from 'path'
import Bailo from '../../lib/node.js'
import fs from 'fs'
import { fileFromPath } from 'formdata-node/file-from-path'
import logger from '../utils/logger.js'
import open from 'open'

async function uploadExampleModel() {
  const api = new Bailo('http://localhost:8080/api/v1')

  const defaultSchema = await api.getDefaultSchema('UPLOAD')

  const metadata = JSON.parse(
    fs.readFileSync(join(__dirname, '../../__tests__/example_models/minimal_model/minimal_metadata.json'), 'utf-8')
  )
  metadata.schemaRef = defaultSchema.schema.reference

  const { uuid } = await api.postModel(
    await fileFromPath(join(__dirname, '../../__tests__/example_models/minimal_model/minimal_code.zip')),
    await fileFromPath(join(__dirname, '../../__tests__/example_models/minimal_model/minimal_binary.zip')),
    metadata
  )

  logger.info({ uuid }, `Successfully uploaded model '${uuid}'`)
  await open(`http://localhost:8080/model/${uuid}`)

  return uuid
}

uploadExampleModel()
