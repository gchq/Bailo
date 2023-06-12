import { fileFromPath } from 'formdata-node/file-from-path'
import open from 'open'
import { join } from 'path'
import { fileURLToPath } from 'url'

import Bailo from '../external/BailoClient.js'
import { EntityKind, ModelMetadata, ModelUploadType } from '../types/types.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import logger from '../utils/logger.js'

const TAR_FILE = './tar/6b379a23-5799-47e1-8977-50b82a936697.tar'

async function uploadTarModel() {
  await connectToMongoose()

  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const api = new Bailo('http://localhost:8080/api/v1')

  const defaultSchema = await api.getDefaultSchema('UPLOAD')

  const metadata: ModelMetadata = {
    highLevelDetails: {
      tags: ['NLP', 'Natural Language Processing', 'BERT', 'Google', 'context'],
      name: 'BERT Language',
      modelInASentence: 'Performs language modelling and next sentence prediction.',
      modelOverview: 'Performs language modelling and next sentence prediction.',
      modelCardVersion: 'v1.0',
    },
    contacts: {
      uploader: [
        {
          kind: EntityKind.USER,
          id: 'user',
        },
      ],
      reviewer: [
        {
          kind: EntityKind.USER,
          id: 'user',
        },
      ],
      manager: [
        {
          kind: EntityKind.USER,
          id: 'user',
        },
      ],
    },
    buildOptions: {
      uploadType: ModelUploadType.Docker,
      seldonVersion: 'seldonio/seldon-core-s2i-python37:1.10.0',
    },
  }
  metadata.schemaRef = defaultSchema.schema.reference

  const { uuid } = await api.postDockerTar(await fileFromPath(join(__dirname, TAR_FILE)), metadata)

  logger.info({ uuid }, `Successfully uploaded model '${uuid}'`)
  await open(`http://localhost:8080/model/${uuid}`)

  await setTimeout(disconnectFromMongoose, 50)

  return uuid
}

uploadTarModel()
