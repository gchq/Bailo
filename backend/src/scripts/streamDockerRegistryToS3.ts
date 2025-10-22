import { ensureBucketExists } from '../clients/s3.js'
import { MirrorKind } from '../connectors/mirroredModel/index.js'
import log from '../services/log.js'
import { addCompressedRegistryImageComponents } from '../services/mirroredModel/mirroredModel.js'
import { finaliseTarGzUpload, initialiseTarGzUpload } from '../services/mirroredModel/tarball.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length !== 4) {
    log.error(
      'Please use format "npm run script -- streamDockerRegistryToS3 <source_model_id> <image_name:image_tag> <destination_model_id> <output_filename>"',
    )
    log.error(
      'e.g. "npm run script -- streamDockerRegistryToS3 source-model-3ozoli alpine:latest destination-model-liq76a source-model-3ozoli_alpine_latest.tar.gz"',
    )
    return
  }
  const [sourceModelId, imageDistributionPackageName, destinationModelId, outputFilename] = args
  log.info({ sourceModelId, imageDistributionPackageName, destinationModelId, outputFilename }, 'Got args')

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)
  const user = { dn: 'user' }

  // main functionality
  const { tarStream, uploadPromise } = await initialiseTarGzUpload(outputFilename, {
    schemaVersion: 1,
    exporter: 'user',
    sourceModelId,
    mirroredModelId: destinationModelId,
    importKind: MirrorKind.Image,
    distributionPackageName: imageDistributionPackageName.replace(sourceModelId, destinationModelId),
  })
  await addCompressedRegistryImageComponents(user, sourceModelId, imageDistributionPackageName, tarStream)
  await finaliseTarGzUpload(tarStream, uploadPromise)

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
