import prettyMs from 'pretty-ms'
import { QueueMessage } from '../../lib/p-mongo-queue/pMongoQueue'
import { findVersionById, markVersionBuilt } from '../services/version'
import { buildPython } from '../utils/build'
import logger from '../utils/logger'
import { getUserByInternalId } from '../services/user'

import { BuildHandler } from '../utils/build/BuildHandler'
import createWorkingDirectory from '../utils/build/CreateWorkingDirectory'
import getRawFiles from '../utils/build/GetRawFiles'
import extractFiles from '../utils/build/ExtractFiles'
import getSeldonDockerfile from '../utils/build/GetSeldonDockerfile'
import imgBuildDockerfile from '../utils/build/ImgBuildDockerfile'
import { getUploadQueue } from '../utils/queues'

export default async function processUploads() {
  ;(await getUploadQueue()).process(async (msg: QueueMessage) => {
    logger.info({ job: msg.payload }, 'Started processing upload')

    const user = await getUserByInternalId(msg.payload.userId)
    if (!user) {
      throw new Error(`Unable to find upload user '${msg.payload.userId}'`)
    }

    const version = await findVersionById(user, msg.payload.versionId, { populate: true })
    if (!version) {
      throw new Error(`Unable to find version '${msg.payload.versionId}'`)
    }

    const buildHandler = new BuildHandler([
      { construct: createWorkingDirectory() },
      { construct: getRawFiles() },
      { construct: extractFiles() },
      { construct: getSeldonDockerfile() },
      { construct: imgBuildDockerfile() },
    ])

    await buildHandler.process(version, {
      binary: msg.payload.binary,
      code: msg.payload.code,
    })

    await markVersionBuilt(version._id)
  })
}
