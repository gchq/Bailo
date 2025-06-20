import zlib from 'node:zlib'

import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { exportCompressedRegistryImage, uploadToExportS3Location } from '../services/mirroredModel.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length != 3) {
    log.error('Please use format "npm run script -- streamDockerRegistryToS3 <model-id> <image-name> <image-tag>"')
    return
  }
  const imageModel = args[0]
  const imageName = args[1]
  const imageTag = args[2]
  log.info({ imageModel, imageName, imageTag })

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })

  // start early upload to allow gzip to drain
  const s3Upload = uploadToExportS3Location(
    `registry/script/${imageModel}/${imageName}/${imageTag}.tar.gz`,
    gzipStream,
    {},
  )

  // main functionality
  await exportCompressedRegistryImage({ dn: 'user' }, gzipStream, imageModel, imageName, imageTag, {})
  await s3Upload

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
