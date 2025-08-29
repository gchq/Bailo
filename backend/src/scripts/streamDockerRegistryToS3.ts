import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { exportCompressedRegistryImage, ImportKind } from '../services/mirroredModel/mirroredModel.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length != 2) {
    log.error('Please use format "npm run script -- streamDockerRegistryToS3 <model-id> <image-name:image-tag>"')
    return
  }
  const imageModel = args[0]
  const imageDistributionPackageName = args[1]
  log.info({ imageModel, imageDistributionPackageName })

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)

  // main functionality
  await exportCompressedRegistryImage({ dn: 'user' }, imageModel, imageDistributionPackageName, {
    exporter: 'user',
    sourceModelId: imageModel,
    mirroredModelId: '',
    importKind: ImportKind.Image,
    distributionPackageName: '',
  })

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
