import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { addCompressedRegistryImageComponents, ImportKind } from '../services/mirroredModel/mirroredModel.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { finaliseTarGzUpload, initialiseTarGzUpload } from '../utils/tarball.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length !== 3) {
    log.error(
      'Please use format "npm run script -- streamDockerRegistryToS3 <model-id> <image-name:image-tag> <output-filename>"',
    )
    log.error(
      'e.g. "npm run script -- streamDockerRegistryToS3 sample-model-3ozoli alpine:latest sample-model-3ozoli_alpine_latest.tar.gz"',
    )
    return
  }
  const [imageModelId, imageDistributionPackageName, outputFilename] = args
  log.info({ imageModelId, imageDistributionPackageName, outputFilename })

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)
  const user = { dn: 'user' }

  // main functionality
  const { tarStream, uploadPromise } = await initialiseTarGzUpload(outputFilename, {
    exporter: 'user',
    sourceModelId: imageModelId,
    mirroredModelId: '',
    importKind: ImportKind.Image,
    distributionPackageName: '',
  })
  await addCompressedRegistryImageComponents(user, imageModelId, imageDistributionPackageName, tarStream)
  await finaliseTarGzUpload(tarStream, uploadPromise)

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
