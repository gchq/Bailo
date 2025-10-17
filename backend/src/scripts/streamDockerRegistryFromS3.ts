import { ensureBucketExists } from '../clients/s3.js'
import log from '../services/log.js'
import { getObjectFromExportS3Location } from '../services/mirroredModel/s3.js'
import { extractTarGzStream } from '../services/mirroredModel/tarball.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { shortId } from '../utils/id.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length !== 1) {
    log.error('Please use format "npm run script -- streamDockerRegistryFromS3 <input-s3-path>"')
    log.error(
      'e.g. "npm run script -- streamDockerRegistryFromS3 https://localhost:8080/export/sample-model-3ozoli_alpine_latest.tar.gz"',
    )
    return
  }
  const [inputS3Path] = args
  log.debug({ inputS3Path }, 'Got args')

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)

  // main functionality
  const importId = shortId()
  const fileBlob = await getObjectFromExportS3Location(inputS3Path, { importId })
  await extractTarGzStream(fileBlob, { dn: 'user' }, { importId })

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
