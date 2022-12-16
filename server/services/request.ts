import { Types } from 'mongoose'
import { getEntitiesForUser, getUserListFromEntityList, parseEntityList } from '../utils/entity'
import { ApprovalStates, Request, Entity } from '../../types/interfaces'
import { DeploymentDoc } from '../models/Deployment'
import RequestModel, { ApprovalTypes, RequestTypes } from '../models/Request'
import { VersionDoc } from '../models/Version'
import { reviewRequest } from '../templates/reviewRequest'
import { BadReq } from '../utils/result'
import { sendEmail } from '../utils/smtp'
import { getUserByInternalId } from './user'
import { UserDoc } from '../models/User'

export async function createDeploymentRequests({
  version,
  deployment,
}: {
  version: VersionDoc
  deployment: DeploymentDoc
}) {
  const managers = await parseEntityList(version.metadata.contacts.manager)

  if (!managers.valid) {
    throw BadReq({ managers: version.metadata.contacts.manager }, `Invalid manager: ${managers.reason}`)
  }

  return createDeploymentRequest({
    approvers: version.metadata.contacts.manager,
    deployment,
    approvalType: ApprovalTypes.Manager,
  })
}

export async function createVersionRequests({ version }: { version: VersionDoc }) {
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

  const managerRequest = createVersionRequest({
    approvers: version.metadata.contacts.manager,
    version,
    approvalType: ApprovalTypes.Manager,
  })

  const reviewerRequest = createVersionRequest({
    approvers: version.metadata.contacts.reviewer,
    version,
    approvalType: ApprovalTypes.Reviewer,
  })

  return Promise.all([managerRequest, reviewerRequest])
}

async function createDeploymentRequest({
  approvers,
  approvalType,
  deployment,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  deployment: DeploymentDoc
}): Promise<Request> {
  return createRequest({
    documentType: 'deployment',
    document: deployment,
    approvers,

    approvalType,
    requestType: RequestTypes.Deployment,
  })
}

async function createVersionRequest({
  approvers,
  approvalType,
  version,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  version: VersionDoc
}): Promise<Request> {
  return createRequest({
    documentType: 'version',
    document: version,
    approvers,

    approvalType,
    requestType: RequestTypes.Upload,
  })
}

export type RequestDocumentType = 'version' | 'deployment'
async function createRequest({
  documentType,
  document,
  approvers,
  approvalType,
  requestType,
}: {
  documentType: RequestDocumentType
  document: VersionDoc | DeploymentDoc
  approvers: Array<Entity>

  approvalType: ApprovalTypes
  requestType: RequestTypes
}) {
  const doc = {
    [documentType]: document._id,
    approvers,

    approvalType,
    request: requestType,
  }

  // If a request already exists, we don't want to create a
  // duplicate request
  const { value: request, lastErrorObject } = (await RequestModel.findOneAndUpdate(
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
    const users = await getUserListFromEntityList(approvers)

    for (const user of users) {
      if (user.email) {
        // we created a new request, send out a notification.
        await sendEmail({
          to: user.email,
          ...reviewRequest({
            document,
            requestType,
          }),
        })
      }
    }
  }

  return request
}

export async function readNumRequests({ userId }: { userId: Types.ObjectId }) {
  const user = await getUserByInternalId(userId)

  if (!user) {
    throw new Error(`Finding requests for user that does not exist: ${userId}`)
  }

  const userEntities = await getEntitiesForUser(user)

  return RequestModel.countDocuments({
    status: 'No Response',
    $or: userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    })),
  })
}

export type RequestFilter = Types.ObjectId | undefined
export async function readRequests({
  type,
  filter,
  archived,
}: {
  type: RequestTypes
  filter: RequestFilter
  archived: boolean
}) {
  const query: any = {
    status: 'No Response',
    request: type,
  }

  if (filter) {
    const user = await getUserByInternalId(filter)

    if (!user) {
      throw new Error(`Finding requests for user that does not exist: ${filter}`)
    }

    const userEntities = await getEntitiesForUser(user)

    query.$or = userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    }))
  }

  if (archived) {
    query.status = { $ne: 'No Response' }
  }

  return RequestModel.find(query)
    .populate({
      path: 'version',
      populate: { path: 'model' },
    })
    .populate({
      path: 'deployment',
      populate: { path: 'model' },
    })
    .sort({ updatedAt: -1 })
}

export async function getRequest({ requestId }: { requestId: string | Types.ObjectId }) {
  const request = await RequestModel.findById(requestId)

  if (!request) {
    throw BadReq({ requestId }, `Unable to find request '${requestId}'`)
  }

  return request
}

export async function deleteRequestsByVersion(user: UserDoc, version: VersionDoc) {
  return (RequestModel as any).delete(
    {
      version: version._id,
    },
    user._id
  )
}

export async function deleteRequestsByDeployment(user: UserDoc, deployment: DeploymentDoc) {
  return (RequestModel as any).delete(
    {
      deployment: deployment._id,
    },
    user._id
  )
}
