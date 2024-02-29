import ApprovalModel from '../models/Approval.js'
import DeploymentModel from '../models/Deployment.js'
import ModelModel from '../models/Model.js'
import UserModel from '../models/User.js'
import VersionModel from '../models/Version.js'
import { EntityKind } from '../types/types.js'
import logger from '../utils/logger.js'

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
      { kind: EntityKind.USER, id: deployment.metadata.contacts.requester as string },
      { kind: EntityKind.USER, id: deployment.metadata.contacts.secondPOC as string },
    ]

    delete deployment.metadata.contacts.requester
    delete deployment.metadata.contacts.secondPOC

    deployment.markModified('metadata')
    await deployment.save()
  }

  const models = await ModelModel.find({})

  logger.info({ count: models.length }, 'Processing models')
  for (const model of models) {
    const latestVersion = await VersionModel.findById(model.latestVersion)
    if (latestVersion) {
      if (
        Array.isArray(latestVersion.metadata.contacts.uploader) ||
        Array.isArray(latestVersion.metadata.contacts.reviewer) ||
        Array.isArray(latestVersion.metadata.contacts.manager)
      ) {
        continue
      }

      latestVersion.metadata.contacts.uploader = [
        { kind: EntityKind.USER, id: latestVersion.metadata.contacts.uploader },
      ]
      latestVersion.metadata.contacts.reviewer = [
        { kind: EntityKind.USER, id: latestVersion.metadata.contacts.reviewer },
      ]
      latestVersion.metadata.contacts.manager = [{ kind: EntityKind.USER, id: latestVersion.metadata.contacts.manager }]

      model.markModified('latestVersion')
      await model.save()
    }
  }

  const approvals = await ApprovalModel.find({})

  logger.info({ count: approvals.length }, 'Processing approvals')
  for (const approval of approvals) {
    if (Array.isArray(approval.approvers) && approval.approvers.length) {
      continue
    }

    const user = await UserModel.findById(approval.get('user'))

    if (!user) {
      throw new Error('Tried to migrate approval but could not identify user')
    }

    const { id } = user

    approval.approvers = [{ kind: EntityKind.USER, id }]
    await approval.save()
  }

  await ApprovalModel.updateMany({}, { $unset: { user: 1 } }, { strict: false })

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
