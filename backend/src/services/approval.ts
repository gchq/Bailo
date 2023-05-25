import { Types } from 'mongoose'

import ApprovalModel from '../models/Approval.js'
import { reviewApproval } from '../templates/reviewApproval.js'
import {
  Approval,
  ApprovalCategory,
  ApprovalStates,
  ApprovalTypes,
  DeploymentDoc,
  Entity,
  UserDoc,
  VersionDoc,
} from '../types/types.js'
import { getEntitiesForUser, getUserListFromEntityList, parseEntityList } from '../utils/entity.js'
import { getDeploymentQueue } from '../utils/queues.js'
import { BadReq } from '../utils/result.js'
import { sendEmail } from '../utils/smtp.js'
import { findModelById } from './model.js'
import { getUserByInternalId } from './user.js'
import { findVersionById } from './version.js'

export async function createDeploymentApprovals({
  deployment,
  version,
  user,
}: {
  deployment: DeploymentDoc
  version: VersionDoc
  user: UserDoc
}) {
  const managers = await parseEntityList(version.metadata.contacts.manager)

  if (!managers.valid) {
    throw BadReq({ managers: version.metadata.contacts.owner }, `Invalid manager: ${managers.reason}`)
  }

  return createDeploymentApproval({
    approvers: version.metadata.contacts.manager,
    deployment,
    approvalType: ApprovalTypes.Manager,
    user,
  })
}

export async function createVersionApprovals({ version, user }: { version: VersionDoc; user: UserDoc }) {
  const [managers, reviewers] = await Promise.all([
    parseEntityList(version.metadata.contacts.manager),
    parseEntityList(version.metadata.contacts.reviewer),
  ])

  if (!managers.valid) {
    throw BadReq({ managers: version.metadata.contacts.manager }, `Invalid manager: ${managers.reason}`)
  }

  if (!reviewers.valid) {
    throw BadReq({ reviewers: version.metadata.contacts.reviewer }, `Invalid reviewer: '${reviewers.reason}'`)
  }

  const managerApproval = createVersionApproval({
    approvers: version.metadata.contacts.manager,
    version,
    approvalType: ApprovalTypes.Manager,
    user,
  })

  const reviewerApproval = createVersionApproval({
    approvers: version.metadata.contacts.reviewer,
    version,
    approvalType: ApprovalTypes.Reviewer,
    user,
  })

  return Promise.all([managerApproval, reviewerApproval])
}

async function createDeploymentApproval({
  approvers,
  approvalType,
  deployment,
  user,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  deployment: DeploymentDoc
  user: UserDoc
}): Promise<Approval> {
  return createApproval({
    documentType: 'deployment',
    document: deployment,
    approvers,
    user,

    approvalType,
    approvalCategory: ApprovalCategory.Deployment,
  })
}

async function createVersionApproval({
  approvers,
  approvalType,
  version,
  user,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  version: VersionDoc
  user: UserDoc
}): Promise<Approval> {
  return createApproval({
    documentType: 'version',
    document: version,
    approvers,
    user,

    approvalType,
    approvalCategory: ApprovalCategory.Upload,
  })
}

export type ApprovalDocumentType = 'version' | 'deployment'
async function createApproval({
  documentType,
  document,
  approvers,
  approvalType,
  approvalCategory,
  user,
}: {
  documentType: ApprovalDocumentType
  document: VersionDoc | DeploymentDoc
  approvers: Array<Entity>

  approvalType: ApprovalTypes
  approvalCategory: ApprovalCategory
  user: UserDoc
}) {
  const doc = {
    [documentType]: document._id,
    approvers,

    approvalType,
    approvalCategory,
  }

  // If an approval already exists, we don't want to create a duplicate approval
  const { value: approval, lastErrorObject } = (await ApprovalModel.findOneAndUpdate(
    doc,
    {
      [documentType]: document._id,
      status: ApprovalStates.NoResponse,
    },
    {
      upsert: true,
      new: true,
      rawResult: true,
    }
  )) as unknown as any

  if (!lastErrorObject?.updatedExisting) {
    const recipients = await getUserListFromEntityList(approvers)

    for (const recipient of recipients) {
      if (recipient.email) {
        // we created a new approval, send out a notification.
        await sendEmail({
          to: recipient.email,
          ...(await reviewApproval({
            document,
            approvalCategory,
            user,
          })),
        })
      }
    }
  }

  return approval
}

export async function readNumApprovals({ userId }: { userId: Types.ObjectId }) {
  const user = await getUserByInternalId(userId)

  if (!user) {
    throw new Error(`Finding approvals for user that does not exist: ${userId}`)
  }

  const userEntities = await getEntitiesForUser(user)

  return ApprovalModel.countDocuments({
    status: 'No Response',
    $or: userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    })),
  })
}

export type ApprovalFilter = Types.ObjectId | undefined
export async function readApprovals({
  approvalCategory,
  filter,
  archived,
}: {
  approvalCategory: ApprovalCategory
  filter: ApprovalFilter
  archived: boolean
}) {
  const query: any = {
    status: 'No Response',
    approvalCategory,
  }

  if (filter) {
    const user = await getUserByInternalId(filter)

    if (!user) {
      throw new Error(`Finding approvals for user that does not exist: ${filter}`)
    }

    const userEntities = await getEntitiesForUser(user)

    query.$or = userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    }))
  }

  if (archived) {
    query.status = { $ne: 'No Response' }
  }

  return ApprovalModel.find(query)
    .populate({
      path: 'version',
      populate: {
        path: 'model',
        populate: {
          path: 'latestVersion',
        },
      },
    })
    .populate({
      path: 'deployment',
      populate: {
        path: 'model',
        populate: {
          path: 'latestVersion',
        },
      },
    })
    .sort({ updatedAt: -1 })
}

export async function getApproval({ approvalId }: { approvalId: string | Types.ObjectId }) {
  const approval = await ApprovalModel.findById(approvalId)

  if (!approval) {
    throw BadReq({ approvalId }, `Unable to find approval '${approvalId}'`)
  }

  return approval
}

export async function deleteApprovalsByVersion(user: UserDoc, version: VersionDoc) {
  return (ApprovalModel as any).delete(
    {
      version: version._id,
    },
    user._id
  )
}

export async function deleteApprovalsByDeployment(user: UserDoc, deployment: DeploymentDoc) {
  return (ApprovalModel as any).delete(
    {
      deployment: deployment._id,
    },
    user._id
  )
}

export async function requestDeploymentsForModelVersions(user: UserDoc, deployment: DeploymentDoc) {
  const model = await findModelById(user, deployment.model)
  if (!model) {
    throw BadReq({ code: 'model_not_found', deployment }, `Could not find parent model for deployment '${deployment}'`)
  }
  const { versions } = model
  if (!versions) {
    throw BadReq(
      { code: 'versions_not_found', deployment },
      `Could not find versions for deployment '${deployment.uuid}'`
    )
  }
  versions.forEach(async (versionId) => {
    const versionDoc = await findVersionById(user, versionId)
    if (!versionDoc) {
      throw BadReq(
        { code: 'versions_not_found', deployment },
        `Could not find version for deployment '${deployment.uuid}'`
      )
    }
    if (
      versionDoc.managerApproved === ApprovalStates.Accepted &&
      versionDoc.reviewerApproved === ApprovalStates.Accepted
    ) {
      await (
        await getDeploymentQueue()
      ).add({
        deploymentId: deployment._id,
        userId: user._id,
        version: versionDoc.version,
      })
    }
  })
}
