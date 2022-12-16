import config from 'config'
import mongoose from 'mongoose'
// eslint-disable-next-line import/no-relative-packages
import PMongoQueue, { QueueMessage } from '../../lib/p-mongo-queue/pMongoQueue'
import { ModelDoc } from '../models/Model'
import { findDeploymentById } from '../services/deployment'
import { getUserByInternalId } from '../services/user'
import { findVersionById, markVersionState } from '../services/version'
import { simpleEmail } from '../templates/simpleEmail'
import { connectToMongoose } from './database'
import { sendEmail } from './smtp'
import { getUserListFromEntityList } from './entity'
import logger from './logger'

let uploadQueue: PMongoQueue | undefined
let deploymentQueue: PMongoQueue | undefined
let mongoClient: mongoose.Connection | undefined

export async function closeMongoInstance() {
  return mongoClient?.close()
}

export async function getMongoInstance() {
  if (mongoClient === undefined) {
    await connectToMongoose()
    mongoClient = mongoose.connection
  }

  return mongoClient
}

export async function getUploadQueue() {
  if (!uploadQueue) {
    const client = await getMongoInstance()
    const uploadDeadQueue = new PMongoQueue(client.db, 'queue-uploads-dead')
    uploadQueue = new PMongoQueue(client.db, 'queue-uploads', {
      deadQueue: uploadDeadQueue,
      maxRetries: 2,
      visibility: 60 * 9,
    })

    uploadQueue.on('succeeded', async (message: QueueMessage) => {
      await setUploadState(message, 'succeeded')
    })

    uploadQueue.on('retrying', async (message: QueueMessage, e: any) => {
      await setUploadState(message, 'retrying', e)
    })

    uploadQueue.on('failed', async (message: QueueMessage, e: any) => {
      await setUploadState(message, 'failed', e)
    })
  }

  return uploadQueue
}

export async function getDeploymentQueue() {
  if (!deploymentQueue) {
    const client = await getMongoInstance()
    const deploymentDeadQueue = new PMongoQueue(client.db, 'queue-deployments-dead')
    deploymentQueue = new PMongoQueue(client.db, 'queue-deployments', {
      deadQueue: deploymentDeadQueue,
      maxRetries: 2,
      visibility: 15,
    })

    deploymentQueue.on('succeeded', async (message: QueueMessage) => {
      await sendDeploymentEmail(message, 'succeeded')
    })

    deploymentQueue.on('retrying', async (message: QueueMessage, e: any) => {
      await sendDeploymentEmail(message, 'retrying', e)
    })

    deploymentQueue.on('failed', async (message: QueueMessage, e: any) => {
      await sendDeploymentEmail(message, 'failed', e)
    })
  }

  return deploymentQueue
}

async function setUploadState(msg: QueueMessage, state: string, _e?: any) {
  const owner = await getUserByInternalId(msg.payload.userId)
  if (!owner) {
    throw new Error(`Unable to find user '${msg.payload.userId}'`)
  }

  const version = await findVersionById(owner, msg.payload.versionId, { populate: true })
  if (!version) {
    throw new Error(`Unable to find version '${msg.payload.versionId}'`)
  }

  const model = version.model as ModelDoc

  await markVersionState(owner, msg.payload.versionId, state)

  const message = state === 'retrying' ? 'failed but is retrying' : state
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`

  const userList = await getUserListFromEntityList(model.currentMetadata.contacts.uploader)

  if (userList.length > 20) {
    // refusing to send more than 20 emails.
    logger.warn({ count: userList.length, model }, 'Refusing to send too many emails')
    return
  }

  for (const user of userList) {
    if (!user.email) {
      continue
    }

    await sendEmail({
      to: user.email,
      ...simpleEmail({
        text: `Your model build for '${model.currentMetadata.highLevelDetails.name}' has ${message}`,
        columns: [
          { header: 'Model Name', value: model.currentMetadata.highLevelDetails.name },
          { header: 'Build Type', value: 'Model' },
          { header: 'Status', value: state.charAt(0).toUpperCase() + state.slice(1) },
        ],
        buttons: [{ text: 'Build Logs', href: `${base}/model/${model.uuid}` }],
        subject: `Your model build for '${model.currentMetadata.highLevelDetails.name}' has ${message}`,
      }),
    })
  }
}

async function sendDeploymentEmail(msg: QueueMessage, state: string, _e?: any) {
  const owner = await getUserByInternalId(msg.payload.userId)
  if (!owner) {
    throw new Error(`Unable to find user '${msg.payload.userId}'`)
  }

  const deployment = await findDeploymentById(owner, msg.payload.deploymentId, { populate: true })
  if (!deployment) {
    throw new Error(`Unable to find deployment '${msg.payload.deploymentId}'`)
  }

  const message = state === 'retrying' ? 'failed but is retrying' : state
  const base = `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`
  const model = deployment.model as ModelDoc

  const userList = await getUserListFromEntityList(deployment.metadata.contacts.owner)

  if (userList.length > 20) {
    // refusing to send more than 20 emails.
    logger.warn({ count: userList.length, deployment }, 'Refusing to send too many emails')
    return
  }

  for (const user of userList) {
    if (!user.email) {
      continue
    }

    await sendEmail({
      to: user.email,
      ...simpleEmail({
        text: `Your deployment for '${model.currentMetadata.highLevelDetails.name}' has ${message}`,
        columns: [
          { header: 'Model Name', value: model.currentMetadata.highLevelDetails.name },
          { header: 'Build Type', value: 'Deployment' },
          { header: 'Status', value: state.charAt(0).toUpperCase() + state.slice(1) },
        ],
        buttons: [{ text: 'Build Logs', href: `${base}/deployment/${deployment.uuid}` }],
        subject: `Your deployment for '${model.currentMetadata.highLevelDetails.name}' has ${message}`,
      }),
    })
  }
}
