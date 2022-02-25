import Queue from 'bee-queue'
import config from 'config'
import DeploymentModel from '../models/Deployment'
import VersionModel from '../models/Version'
import { simpleEmail } from '../templates/simpleEmail'
import { sendEmail } from './smtp'

export const uploadQueue = new Queue('UPLOAD_QUEUE', {
  redis: config.get('redis'),

  // model building may take a few minutes, especially when the cache is cold
  stallInterval: 120000,
})

export const deploymentQueue = new Queue('DEPLOYMENT_QUEUE', {
  redis: config.get('redis'),
})

async function setUploadState(jobId: string, state: string) {
  const job = await uploadQueue.getJob(jobId)
  const version = await VersionModel.findById(job.data.versionId).populate({
    path: 'model',
    populate: { path: 'owner' },
  })

  version.state.build = {
    ...(version.state.build || {}),
    state,
  }

  if (state === 'succeeded') {
    version.state.build.reason = undefined
  }

  version.markModified('state')
  await version.save()

  if (!version.model.owner.email) {
    return
  }

  const message = state === 'retrying' ? 'failed but is retrying' : state
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  await sendEmail({
    to: version.model.owner.email,
    ...simpleEmail({
      text: `Your model build for '${version.model.currentMetadata.highLevelDetails.name}' has ${message}`,
      columns: [
        { header: 'Model Name', value: version.model.currentMetadata.highLevelDetails.name },
        { header: 'Build Type', value: 'Model' },
        { header: 'Status', value: state.charAt(0).toUpperCase() + state.slice(1) },
      ],
      buttons: [{ text: 'Build Logs', href: `${base}/model/${version.model.uuid}` }],
      subject: `Your model build for '${version.model.currentMetadata.highLevelDetails.name}' has ${message}`,
    }),
  })
}

uploadQueue.on('job succeeded', async (jobId) => {
  await setUploadState(jobId, 'succeeded')
})

uploadQueue.on('job retrying', async (jobId) => {
  await setUploadState(jobId, 'retrying')
})

uploadQueue.on('job failed', async (jobId) => {
  await setUploadState(jobId, 'failed')
})

async function sendDeploymentEmail(jobId: string, state: string) {
  const job = await deploymentQueue.getJob(jobId)
  const deployment = await DeploymentModel.findById(job.data.deploymentId).populate('owner').populate('model')

  if (!deployment.owner.email) {
    return
  }

  const message = state === 'retrying' ? 'failed but is retrying' : state
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  await sendEmail({
    to: deployment.owner.email,
    ...simpleEmail({
      text: `Your deployment for '${deployment.model.currentMetadata.highLevelDetails.name}' has ${message}`,
      columns: [
        { header: 'Model Name', value: deployment.model.currentMetadata.highLevelDetails.name },
        { header: 'Build Type', value: 'Deployment' },
        { header: 'Status', value: state.charAt(0).toUpperCase() + state.slice(1) },
      ],
      buttons: [{ text: 'Build Logs', href: `${base}/deployment/${deployment.uuid}` }],
      subject: `Your deployment for '${deployment.model.currentMetadata.highLevelDetails.name}' has ${message}`,
    }),
  })
}

deploymentQueue.on('job succeeded', async (jobId) => {
  await sendDeploymentEmail(jobId, 'succeeded')
})

deploymentQueue.on('job retrying', async (jobId) => {
  await sendDeploymentEmail(jobId, 'retrying')
})

deploymentQueue.on('job failed', async (jobId) => {
  await sendDeploymentEmail(jobId, 'failed')
})
