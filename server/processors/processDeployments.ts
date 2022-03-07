import DeploymentModel from '../models/Deployment'
import { deploymentQueue } from '../utils/queues'
import config from 'config'
import prettyMs from 'pretty-ms'
import https from 'https'
import logger from '../utils/logger'
import { getAccessToken } from '../routes/v1/registryAuth'
import UserModel from '../models/User'

const _httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

export default function processDeployments() {
  deploymentQueue.process(async (job) => {
    logger.info({ job: job.data }, 'Started processing deployment')
    try {
      const startTime = new Date()

      const { deploymentId } = job.data
      const deployment = await DeploymentModel.findById(deploymentId).populate('model')

      const dlog = logger.child({ deploymentId: deployment._id })

      if (!deployment) {
        dlog.error('Unable to find deployment')
        throw new Error('Unable to find deployment')
      }

      const user = await UserModel.findById(deployment.owner)

      if (!user) {
        dlog.error('Unable to find deployment owner')
        throw new Error('Unable to find deployment owner')
      }

      const { modelID, initialVersionRequested } = deployment.metadata.highLevelDetails

      const registry = `http://${config.get('registry.host')}/v2`
      const tag = `${modelID}:${initialVersionRequested}`
      const externalImage = `${config.get('registry.host')}/${user.id}/${tag}`

      deployment.log('info', `Retagging image.  Current: internal/${tag}`)
      deployment.log('info', `New: ${user.id}/${tag}`)

      const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
        { type: 'repository', name: `internal/${modelID}`, actions: ['pull'] },
        { type: 'repository', name: `${user.id}/${modelID}`, actions: ['push', 'pull'] },
      ])
      const authorisation = `Bearer ${token}`

      deployment.log('info', `Requesting ${registry}/internal/${modelID}/manifests/${initialVersionRequested}`)
      const manifest = await fetch(`${registry}/internal/${modelID}/manifests/${initialVersionRequested}`, {
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          Authorization: authorisation,
        },
        // agent: httpsAgent,
      } as RequestInit).then((res: any) => res.json())

      deployment.log('info', `Received manifest with ${manifest.layers.length} layers`)

      await Promise.all(
        manifest.layers.map(async (layer: any) => {
          const res = await fetch(
            `${registry}/user/${modelID}/blobs/uploads/?mount=${layer.digest}&from=internal/${modelID}`,
            {
              method: 'POST',
              headers: {
                Authorization: authorisation,
              },
              // agent: httpsAgent,
            } as RequestInit
          )

          if (res.status >= 400) {
            throw new Error('Invalid status response: ' + res.status)
          }

          deployment.log('info', `Copied layer ${layer.digest}`)
        })
      )

      const mountPostRes = await fetch(
        `${registry}/user/${modelID}/blobs/uploads/?mount=${manifest.config.digest}&from=internal/${modelID}`,
        {
          method: 'POST',
          headers: {
            Authorization: authorisation,
          },
          // agent: httpsAgent,
        } as RequestInit
      )

      if (mountPostRes.status >= 400) {
        throw new Error('Invalid status response in mount post: ' + mountPostRes.status)
      }

      deployment.log('info', `Copied manifest to new repository`)

      const manifestPutRes = await fetch(`${registry}/user/${modelID}/manifests/${initialVersionRequested}`, {
        method: 'PUT',
        body: JSON.stringify(manifest),
        headers: {
          Authorization: authorisation,
          'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json',
        },
        // agent: httpsAgent,
      } as RequestInit)

      if (manifestPutRes.status >= 400) {
        throw new Error('Invalid status response in manifest put: ' + manifestPutRes.status)
      }

      deployment.log('info', 'Finalised new manifest')
      dlog.info('Marking build as successful')
      await DeploymentModel.findOneAndUpdate({ _id: deployment._id }, { built: true })

      const time = prettyMs(new Date().getTime() - startTime.getTime())
      await deployment.log('info', `Processed deployment with tag '${externalImage}' in ${time}`)
    } catch (e) {
      logger.error({ error: e, deploymentId: job.data.deploymentId }, 'Error occurred whilst processing deployment')
      throw e
    }
  })
}
