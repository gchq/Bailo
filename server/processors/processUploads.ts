import { buildPython } from '../utils/build'
import { uploadQueue } from '../utils/queues'
import prettyMs from 'pretty-ms'
import VersionModel from '../models/Version'
import logger from '../utils/logger'

export default function processUploads() {
  uploadQueue.process(async (job) => {
    logger.info({ job: job.data }, 'Started processing upload')
    try {
      const startTime = new Date()
      const version = await VersionModel.findOne({
        _id: job.data.versionId,
      }).populate('model')

      const vlog = logger.child({ versionId: version._id })

      const { binary, code } = job.data
      vlog.info({ binary, code }, 'Starting image build')
      const tag = await buildPython(version, { binary, code })

      vlog.info('Marking build as successful')
      await VersionModel.findOneAndUpdate({ _id: version._id }, { built: true })

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await version.log('info', `Processed job with tag ${tag} in ${time}`)
    } catch (e) {
      logger.error({ error: e, versionId: job.data.versionId }, 'Error occurred whilst processing upload')

      try {
        const version = await VersionModel.findOne({
          _id: job.data.versionId,
        }).populate('model')

        await version.log('error', `Failed to process job due to error: '${e}'`)
        version.state.build = {
          state: 'failed',
          reason: e,
        }

        console.log('mark modified')

        version.markModified('state')
        await version.save()
      } catch (e) {
        logger.error(
          { error: e, versionId: job.data.versionId },
          'Error occurred whilst logging processing error occurred'
        )
      }

      throw e
    }
  })
}
