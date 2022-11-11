import logger from '../utils/logger'
import DeploymentModel from '../models/Deployment'
import ModelModel from '../models/Model'
import RequestModel from '../models/Request'
import VersionModel from '../models/Version'
import UserModel from '../models/User'
import { EntityKind } from '../../types/interfaces'

export async function up() {
  const deployments = await DeploymentModel.find({})

  logger.info({ count: deployments.length }, 'Processing deployments')
  for (const deployment of deployments) {
    const { requester, secondPOC } = deployment.metadata.contacts
    if (!requester && !secondPOC) {
      continue
    }

    if (Array.isArray(deployment.metadata.contacts.owner)) {
      continue
    }

    deployment.metadata.contacts.owner = [
      { kind: EntityKind.USER, id: deployment.metadata.contacts.requester },
      { kind: EntityKind.USER, id: deployment.metadata.contacts.secondPOC },
    ]

    delete deployment.metadata.contacts.requester
    delete deployment.metadata.contacts.secondPOC

    deployment.markModified('metadata')
    await deployment.save()
  }

  const models = await ModelModel.find({})

  logger.info({ count: models.length }, 'Processing models')
  for (const model of models) {
    if (
      Array.isArray(model.currentMetadata.contacts.uploader) ||
      Array.isArray(model.currentMetadata.contacts.reviewer) ||
      Array.isArray(model.currentMetadata.contacts.manager)
    ) {
      continue
    }

    model.currentMetadata.contacts.uploader = [{ kind: EntityKind.USER, id: model.currentMetadata.contacts.uploader }]
    model.currentMetadata.contacts.reviewer = [{ kind: EntityKind.USER, id: model.currentMetadata.contacts.reviewer }]
    model.currentMetadata.contacts.manager = [{ kind: EntityKind.USER, id: model.currentMetadata.contacts.manager }]

    model.markModified('currentMetadata')
    await model.save()
  }

  const requests = await RequestModel.find({})

  logger.info({ count: requests.length }, 'Processing requests')
  for (const request of requests) {
    if (Array.isArray(request.approvers) && request.approvers.length) {
      continue
    }

    const user = await UserModel.findById(request.get('user'))

    if (!user) {
      throw new Error('Tried to migrate request but could not identify user')
    }

    const { id } = user

    request.approvers = [{ kind: EntityKind.USER, id }]
    await request.save()
  }

  await RequestModel.updateMany({}, { $unset: { user: 1 } }, { strict: false })

  const versions = await VersionModel.find({})

  logger.info({ count: versions.length }, 'Processing versions')
  for (const version of versions) {
    if (
      Array.isArray(version.metadata.contacts.uploader) ||
      Array.isArray(version.metadata.contacts.reviewer) ||
      Array.isArray(version.metadata.contacts.manager)
    ) {
      continue
    }

    version.metadata.contacts.uploader = [{ kind: EntityKind.USER, id: version.metadata.contacts.uploader }]
    version.metadata.contacts.reviewer = [{ kind: EntityKind.USER, id: version.metadata.contacts.reviewer }]
    version.metadata.contacts.manager = [{ kind: EntityKind.USER, id: version.metadata.contacts.manager }]

    version.markModified('metadata')
    await version.save()
  }
}

export async function down() {
  // not implemented
}
