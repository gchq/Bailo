import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { importCompressedRegistryImage } from '../services/mirroredModel.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length != 4) {
    log.error(
      'Please use format "npm run script -- streamDockerRegistryFromS3 <input-s3-path> <output-model-id> <output-image-name> <output-image-tag"',
    )
    return
  }
  const inputS3Path = args[0]
  const outputImageModel = args[1]
  const outputImageName = args[2]
  const outputImageTag = args[3]
  log.info({ inputS3Path }, { outputImageModel, outputImageName, outputImageTag })

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)

  // main functionality
  await importCompressedRegistryImage(
    { dn: 'user' },
    outputImageModel,
    outputImageName,
    outputImageTag,
    {},
    inputS3Path,
  )

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
