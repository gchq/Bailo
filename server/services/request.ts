import { Document, Types } from 'mongoose'
import { Deployment, Request, User, Version } from '../../types/interfaces'
import RequestModel from '../models/Request'
import { BadReq } from '../utils/result'
import { sendEmail } from '../utils/smtp'
import { reviewRequest } from '../templates/reviewRequest'
import { getUserById } from './user'

export async function createDeploymentRequests({ version, deployment }: { version: Version; deployment: Deployment }) {
  const manager = await getUserById(version.metadata.contacts.manager)

  if (!manager) {
    throw BadReq(
      { managerId: version.metadata.contacts.manager },
      `Unable to find manager with id: '${version.metadata.contacts.manager}'`
    )
  }

  return await createDeploymentRequest({
    user: manager,
    deployment: deployment,
    approvalType: 'Manager',
  })
}

export async function createVersionRequests({ version }: { version: Version }) {
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
    version: version,
    approvalType: 'Manager',
  })

  const reviewerRequest = createVersionRequest({
    user: reviewer,
    version: version,
    approvalType: 'Reviewer',
  })

  console.log(managerRequest)

  return await Promise.all([managerRequest, reviewerRequest])
}

type DeploymentApprovalType = 'Manager'
async function createDeploymentRequest({
  user,
  approvalType,
  deployment,
}: {
  user: User
  approvalType: DeploymentApprovalType
  deployment: Deployment
}): Promise<Request> {
  return createRequest({
    documentType: 'deployment',
    document: deployment,
    user,

    approvalType,
    requestType: 'Deployment',
  })
}

type VersionApprovalType = 'Manager' | 'Reviewer'
async function createVersionRequest({
  user,
  approvalType,
  version,
}: {
  user: User
  approvalType: VersionApprovalType
  version: Version
}): Promise<Request> {
  console.log('creating version request..')
  return createRequest({
    documentType: 'version',
    document: version as unknown as any,
    user,

    approvalType,
    requestType: 'Upload',
  })
}

export type RequestDocumentType = 'version' | 'deployment'
export type RequestType = 'Upload' | 'Deployment'
async function createRequest({
  documentType,
  document,
  user,
  approvalType,
  requestType,
}: {
  documentType: RequestDocumentType
  document: Document & { model: any; uuid: string }
  user: User

  approvalType: VersionApprovalType | DeploymentApprovalType
  requestType: RequestType
}) {
  const doc = {
    [documentType]: document._id,
    user: user._id,

    approvalType,
    request: requestType,
  }

  console.log('checking for duplicate request')

  // If a request already exists, we don't want to create a
  // duplicate request
  const { value: request, lastErrorObject } = await RequestModel.findOneAndUpdate(
    doc,
    {
      ...doc,
      status: 'No Response',
    },
    {
      upsert: true,
      new: true,
      rawResult: true,
    }
  )
  
  console.log('calling sendEmail')

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

  return await request
}

export async function readNumRequests({ userId }: { userId: Types.ObjectId }) {
  return await RequestModel.countDocuments({
    status: 'No Response',
    user: userId,
  })
}

export type RequestFilter = Types.ObjectId | undefined
export async function readRequests({ type, filter }: { type: RequestType; filter: RequestFilter }) {
  const query: any = {
    status: 'No Response',
    request: type,
  }

  if (filter) {
    query.user = filter
  }

  return await RequestModel.find(query)
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
  const request = (await RequestModel.findById(requestId)) as Request

  if (!request) {
    throw BadReq({ requestId }, `Unable to find request '${requestId}'`)
  }

  return request
}
