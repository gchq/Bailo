import { Types } from 'mongoose'
import { ApprovalStates, Request } from '../../types/interfaces'
import { DeploymentDoc } from '../models/Deployment'
import RequestModel, { ApprovalTypes, RequestTypes } from '../models/Request'
import { UserDoc } from '../models/User'
import { VersionDoc } from '../models/Version'
import { reviewRequest } from '../templates/reviewRequest'
import { BadReq } from '../utils/result'
import { sendEmail } from '../utils/smtp'
import { getUserById } from './user'

export async function createDeploymentRequests({
  version,
  deployment,
}: {
  version: VersionDoc
  deployment: DeploymentDoc
}) {
  const manager = await getUserById(version.metadata.contacts.manager)

  if (!manager) {
    throw BadReq(
      { managerId: version.metadata.contacts.manager },
      `Unable to find manager with id: '${version.metadata.contacts.manager}'`
    )
  }

  return createDeploymentRequest({
    user: manager,
    deployment,
    approvalType: ApprovalTypes.Manager,
  })
}

export async function createVersionRequests({ version }: { version: VersionDoc }) {
  const [manager, reviewer] = await Promise.all([
    getUserById(version.metadata.contacts.manager),
    getUserById(version.metadata.contacts.reviewer),
  ])

  if (!manager) {
    throw BadReq(
      { managerId: version.metadata.contacts.manager },
      `Unable to find manager with id: '${version.metadata.contacts.manager}'`
    )
  }

  if (!reviewer) {
    throw BadReq(
      { reviewerId: version.metadata.contacts.reviewer },
      `Unable to find reviewer with id: '${version.metadata.contacts.reviewer}'`
    )
  }

  const managerRequest = createVersionRequest({
    user: manager,
    version,
    approvalType: ApprovalTypes.Manager,
  })

  const reviewerRequest = createVersionRequest({
    user: reviewer,
    version,
    approvalType: ApprovalTypes.Reviewer,
  })

  return Promise.all([managerRequest, reviewerRequest])
}

async function createDeploymentRequest({
  user,
  approvalType,
  deployment,
}: {
  user: UserDoc
  approvalType: ApprovalTypes
  deployment: DeploymentDoc
}): Promise<Request> {
  return createRequest({
    documentType: 'deployment',
    document: deployment,
    user,

    approvalType,
    requestType: RequestTypes.Deployment,
  })
}

async function createVersionRequest({
  user,
  approvalType,
  version,
}: {
  user: UserDoc
  approvalType: ApprovalTypes
  version: VersionDoc
}): Promise<Request> {
  return createRequest({
    documentType: 'version',
    document: version,
    user,

    approvalType,
    requestType: RequestTypes.Upload,
  })
}

export type RequestDocumentType = 'version' | 'deployment'
async function createRequest({
  documentType,
  document,
  user,
  approvalType,
  requestType,
}: {
  documentType: RequestDocumentType
  document: VersionDoc | DeploymentDoc
  user: UserDoc

  approvalType: ApprovalTypes
  requestType: RequestTypes
}) {
  const doc = {
    [documentType]: document._id,
    user: user._id,

    approvalType,
    request: requestType,
  }

  // If a request already exists, we don't want to create a
  // duplicate request
  const { value: request, lastErrorObject } = (await RequestModel.findOneAndUpdate(
    doc,
    {
      ...doc,
      status: ApprovalStates.NoResponse,
    },
    {
      upsert: true,
      new: true,
      rawResult: true,
    }
  )) as unknown as any

  if (!lastErrorObject?.updatedExisting && user.email) {
    // we created a new request, send out a notification.
    await sendEmail({
      to: user.email,
      ...reviewRequest({
        document,
        requestType,
      }),
    })
  }

  return request
}

export async function readNumRequests({ userId }: { userId: Types.ObjectId }) {
  return RequestModel.countDocuments({
    status: 'No Response',
    user: userId,
  })
}

export type RequestFilter = Types.ObjectId | undefined
export async function readRequests({ type, filter }: { type: RequestTypes; filter: RequestFilter }) {
  const query: any = {
    status: 'No Response',
    request: type,
  }

  if (filter) {
    query.user = filter
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
