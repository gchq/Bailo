import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { exportCompressedRegistryImage, ImportKind } from '../services/mirroredModel.js'
import { splitDistributionPackageName } from '../services/registry.js'
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
  const distributionPackageNameObject = splitDistributionPackageName(imageDistributionPackageName)
  await exportCompressedRegistryImage({ dn: 'user' }, imageModel, imageDistributionPackageName, {
    exporter: 'user',
    sourceModelId: '',
    mirroredModelId: imageModel,
    importKind: ImportKind.Image,
    imageName: distributionPackageNameObject.path,
    imageTag: distributionPackageNameObject['tag'] ? distributionPackageNameObject['tag'] : '',
  })

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
