import { buildPython } from '../utils/build'
import { uploadQueue } from '../utils/queues'
import prettyMs from 'pretty-ms'
import { findVersionById, markVersionBuilt } from '../services/version'
import logger from '../utils/logger'
import { getUserById } from '../services/user'

export default function processUploads() {
  uploadQueue.process(async (job) => {
    logger.info({ job: job.data }, 'Started processing upload')
    try {
      const startTime = new Date()

      const user = await getUserById(job.data.userId)
      const version = await findVersionById(user, job.data.versionId, { populate: true })

      const vlog = logger.child({ versionId: version._id })

      const { binary, code } = job.data
      vlog.info({ binary, code }, 'Starting image build')
      const tag = await buildPython(version, { binary, code })

      vlog.info('Marking build as successful')
      await markVersionBuilt(version._id)

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await version.log('info', `Processed job with tag ${tag} in ${time}`)
    } catch (e) {
      logger.error({ error: e, versionId: job.data.versionId }, 'Error occurred whilst processing upload')

      try {
        const user = await getUserById(job.data.userId)
        const version = await findVersionById(user, job.data.versionId, { populate: true })

        await version.log('error', `Failed to process job due to error: '${e}'`)
        version.state.build = {
          state: 'failed',
          reason: e,
        }

        version.markModified('state')
        await version.save()
      } catch (e2) {
        logger.error(
          { error: e2, versionId: job.data.versionId },
          'Error occurred whilst logging processing error occurred'
        )
      }

      throw e
    }
  })
}
