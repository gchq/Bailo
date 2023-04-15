import https from 'https'
import fetch from 'node-fetch'
import prettyMs from 'pretty-ms'

import { getAccessToken } from '../routes/v1/registryAuth.js'
import { findDeploymentById, markDeploymentBuilt } from '../services/deployment.js'
import { getUserByInternalId } from '../services/user.js'
import config from '../utils/config.js'
import logger from '../utils/logger.js'
import { getDeploymentQueue } from '../utils/queues.js'

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.registry.insecure,
})

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

      const registry = `${config.registry.connection.protocol}://${config.registry.connection.host}/v2`
      const tag = `${modelID}:${version}`
      const externalImage = `${config.registry.connection.host}/${deployment.uuid}/${tag}`

      deployment.log('info', `Retagging image.  Current: internal/${tag}`)
      deployment.log('info', `New: ${user.id}/${tag}`)

      const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
        { type: 'repository', name: `internal/${modelID}`, actions: ['pull'] },
        { type: 'repository', name: `${deployment.uuid}/${modelID}`, actions: ['push', 'pull'] },
      ])
      const authorisation = `Bearer ${token}`

      deployment.log('info', `Requesting ${registry}/internal/${modelID}/manifests/${version}`)
      const manifest = await fetch(`${registry}/internal/${modelID}/manifests/${version}`, {
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          Authorization: authorisation,
        },
        agent: httpsAgent,
      }).then((res: any) => {
        logger.info({
          status: res.status,
        })
        return res.json()
      })

      deployment.log('info', `Received manifest with ${manifest.layers.length} layers`)

      await Promise.all(
        manifest.layers.map(async (layer: any) => {
          const res = await fetch(
            `${registry}/${deployment.uuid}/${modelID}/blobs/uploads/?mount=${layer.digest}&from=internal/${modelID}`,
            {
              method: 'POST',
              headers: {
                Authorization: authorisation,
              },
              agent: httpsAgent,
            }
          )

          if (res.status >= 400) {
            throw new Error(`Invalid status response: ${res.status}`)
          }

          deployment.log('info', `Copied layer ${layer.digest} for version ${version}`)
        })
      )

      const mountPostRes = await fetch(
        `${registry}/${deployment.uuid}/${modelID}/blobs/uploads/?mount=${manifest.config.digest}&from=internal/${modelID}`,
        {
          method: 'POST',
          headers: {
            Authorization: authorisation,
          },
          agent: httpsAgent,
        }
      )

      if (mountPostRes.status >= 400) {
        throw new Error(`Invalid status response in mount post: ${mountPostRes.status}`)
      }

      deployment.log('info', `Copied manifest to new repository`)

      const manifestPutRes = await fetch(`${registry}/${deployment.uuid}/${modelID}/manifests/${version}`, {
        method: 'PUT',
        body: JSON.stringify(manifest),
        headers: {
          Authorization: authorisation,
          'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json',
        },
        agent: httpsAgent,
      })

      if (manifestPutRes.status >= 400) {
        throw new Error(`Invalid status response in manifest put: ${manifestPutRes.status}`)
      }

      deployment.log('info', 'Finalised new manifest')
      dlog.info('Marking build as successful')
      await markDeploymentBuilt(deployment._id)

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await deployment.log('info', `Processed deployment with tag '${externalImage}' in ${time}`)
    } catch (e) {
      logger.error({ error: e, deploymentId: msg.payload.deploymentId }, 'Error occurred whilst processing deployment')
      throw e
    }
  })
}
