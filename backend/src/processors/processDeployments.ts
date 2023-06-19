import prettyMs from 'pretty-ms'

import { findDeploymentById, markDeploymentBuilt } from '../services/deployment.js'
import { getUserByInternalId } from '../services/user.js'
import logger from '../utils/logger.js'
import { getDeploymentQueue } from '../utils/queues.js'
import { copyDockerImage, getDockerPath, ImageRef } from '../utils/skopeo.js'

export default async function processDeployments() {
  ;(await getDeploymentQueue()).process(async (msg) => {
    logger.info({ job: msg.payload }, 'Started processing deployment')
    try {
      const startTime = new Date()

      const { deploymentId, userId, version } = msg.payload

      const user = await getUserByInternalId(userId)

      if (!user) {
        logger.error('Unable to find deployment owner')
        throw new Error('Unable to find deployment owner')
      }

      const deployment = await findDeploymentById(user, deploymentId, { populate: true })

      if (!deployment) {
        logger.error('Unable to find deployment')
        throw new Error('Unable to find deployment')
      }

      const dlog = logger.child({ deploymentId: deployment._id })

      const { modelID } = deployment.metadata.highLevelDetails

      const src: ImageRef = {
        namespace: 'internal',
        model: modelID,
        version: version,
      }

      const dest: ImageRef = {
        namespace: deployment.uuid,
        model: modelID,
        version: version,
      }

      await copyDockerImage(src, dest, deployment.log.bind(deployment))

      dlog.info('Marking build as successful')
      await markDeploymentBuilt(deployment._id)

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await deployment.log('info', `Processed deployment with tag '${getDockerPath(dest)}' in ${time}`)
    } catch (e) {
      logger.error({ error: e, deploymentId: msg.payload.deploymentId }, 'Error occurred whilst processing deployment')
      throw e
    }
  })
}
