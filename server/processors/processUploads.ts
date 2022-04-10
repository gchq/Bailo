import { buildPython } from '../utils/build'
import { getUploadQueue } from '../utils/queues'
import prettyMs from 'pretty-ms'
import { findVersionById, markVersionBuilt } from '../services/version'
import logger from '../utils/logger'
import { getUserById } from '../services/user'
import { QueueMessage } from '../../lib/p-mongo-queue/pMongoQueue'

export default async function processUploads() {
  ;(await getUploadQueue()).process(async (msg: QueueMessage) => {
    logger.info({ job: msg.payload }, 'Started processing upload')
    try {
      const startTime = new Date()

      const user = await getUserById(msg.payload.userId)
      const version = await findVersionById(user, msg.payload.versionId, { populate: true })

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
        const user = await getUserById(msg.payload.userId)
        const version = await findVersionById(user, msg.payload.versionId, { populate: true })

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
