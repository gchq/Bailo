import DeploymentModel from '../models/Deployment'
import { logCommand, runCommand } from '../utils/build'
import { deploymentQueue } from '../utils/queues'
import config from 'config'
import prettyMs from 'pretty-ms'
import https from 'https'
import logger from '../utils/logger'
import { getAdminToken } from '../routes/v1/registryAuth'
import UserModel from '../models/User'

const httpsAgent = new https.Agent({
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

      const _registry = `https://${config.get('registry.host')}/v2`
      const tag = `${modelID}:${initialVersionRequested}`

      deployment.log('info', `Retagging image.  Current: internal/${tag}`)
      deployment.log('info', `New: ${user.id}/${tag}`)

      // const manifest = await fetch(`${registry}/internal/${modelID}/manifests/${initialVersionRequested}`, {
      //   headers: {
      //     'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
      //   },
      //   agent: httpsAgent
      // }).then((res: any) => res.json())

      // deployment.log('info', `manifest ${JSON.stringify(manifest, null, 4)}`)

      // for (let layer of manifest.layers) {
      //   const layerPost = await fetch(`${registry}/user/${modelID}/blobs/uploads/?mount=${layer.digest}&from=internal/${modelID}`, {
      //     method: 'POST',
      //     agent: httpsAgent
      //   })
      //   .then((res: any) => { console.log('mountPost', res.status); return res })
      //   .then((res: any) => res.text())

      //   console.log('layerPost', layerPost)
      // }

      // const mountPost = await fetch(`${registry}/user/${modelID}/blobs/uploads/?mount=${manifest.config.digest}&from=internal/${modelID}`, {
      //   method: 'POST',
      //   agent: httpsAgent
      // })
      //   .then((res: any) => { console.log('mountPost', res.status); return res })
      //   .then((res: any) => res.text())

      // console.log('mountPost', mountPost)

      // deployment.log('info', `Received remote manifest.`)

      // const manifestPut: any = await fetch(`${registry}/user/${modelID}/manifests/${initialVersionRequested}`, {
      //   method: 'PUT',
      //   body: manifest,
      //   headers: {
      //     'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json'
      //   },
      //   agent: httpsAgent
      // }).then((res: any) => res.text())

      // console.log('manifestPut', manifestPut)

      // deployment.log('info', `Updated remote manifest.`)

      // for now, we just carry out the deployment...

      const internalImage = `${config.get('registry.host')}/internal/${tag}`
      const externalImage = `${config.get('registry.host')}/${user.id}/${tag}`
      dlog.info({ internalImage }, 'Pulling docker image')
      
      deployment.log('info', 'Logging into docker')
      await runCommand(`docker login ${config.get('registry.host')} -u admin -p ${await getAdminToken()}`, dlog.info.bind(dlog), dlog.error.bind(dlog))
      deployment.log('info', 'Successfully logged into docker')
      
      await logCommand(`docker pull ${internalImage}`, deployment.log.bind(deployment))
      dlog.info({ internalImage, externalImage }, 'Retagging docker image')
      await logCommand(
        `docker tag ${internalImage} ${externalImage}`,
        deployment.log.bind(deployment)
      )
      dlog.info({ externalImage }, 'Pushing docker image')
      await logCommand(`docker push ${externalImage}`, deployment.log.bind(deployment))

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
