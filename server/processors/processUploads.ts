import { buildPython } from '../utils/build.js'
import { getUploadQueue } from '../utils/queues.js'
import prettyMs from 'pretty-ms'
import { findVersionById, markVersionBuilt } from '../services/version.js'
import logger from '../utils/logger.js'
import { getUserByInternalId } from '../services/user.js'
import { QueueMessage } from '../../lib/p-mongo-queue/pMongoQueue.js'

export default async function processUploads() {
  ;(await getUploadQueue()).process(async (msg: QueueMessage) => {
    logger.info({ job: msg.payload }, 'Started processing upload')
    try {
      const startTime = new Date()

      const user = await getUserByInternalId(msg.payload.userId)

      if (!user) {
        throw new Error(`Unable to find upload user '${msg.payload.userId}'`)
      }

      const version = await findVersionById(user, msg.payload.versionId, { populate: true })
      if (!version) {
        throw new Error(`Unable to find version '${msg.payload.versionId}'`)
      }

      const vlog = logger.child({ versionId: version._id })

      const { binary, code } = msg.payload
      vlog.info({ binary, code }, 'Starting image build')
      const tag = await buildPython(version, { binary, code })

      vlog.info('Marking build as successful')
      await markVersionBuilt(version._id)

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await version.log('info', `Processed job with tag ${tag} in ${time}`)
    } catch (e) {
      logger.error({ error: e, versionId: msg.payload.versionId }, 'Error occurred whilst processing upload')

      try {
        const user = await getUserByInternalId(msg.payload.userId)

        if (!user) {
          throw new Error('Unable to find upload user')
        }

        const version = await findVersionById(user, msg.payload.versionId, { populate: true })
        if (!version) {
          throw new Error(`Unable to find version '${msg.payload.versionId}'`)
        }

        await version.log('error', `Failed to process job due to error: '${e}'`)
        version.state.build = {
          state: 'failed',
          reason: e,
        }

        version.markModified('state')
        await version.save()
      } catch (e2) {
        logger.error(
          { error: e2, versionId: msg.payload.versionId },
          'Error occurred whilst logging processing error occurred'
        )
      }

      throw e
    }
  })
}
