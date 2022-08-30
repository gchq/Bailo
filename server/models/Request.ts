import { Document, model, Schema, Types } from 'mongoose'
import { approvalStateOptions, ApprovalStates, DeploymentDoc } from './Deployment'
import { UserDoc } from './User'
import { VersionDoc } from './Version'

export const approvalTypeOptions = ['Manager', 'Reviewer']

export enum ApprovalTypes {
  Manager = 'Manager',
  Reviewer = 'Reviewer',
}

export const requestTypeOptions = ['Upload', 'Deployment']

export enum RequestTypes {
  Upload = 'Upload',
  Deployment = 'Deployment',
}

export interface Request {
  version: Types.ObjectId | VersionDoc | undefined
  deployment: Types.ObjectId | DeploymentDoc | undefined

  user: UserDoc
  status: ApprovalStates

  approvalType: ApprovalTypes
  request: RequestTypes

  createdAt: Date
  updatedAt: Date
}

export type RequestDoc = Request & Document<any, any, Request>

const RequestSchema = new Schema<Request>(
  {
    // ONE OF THESE TWO
    version: { type: Schema.Types.ObjectId, ref: 'Version' },
    deployment: { type: Schema.Types.ObjectId, ref: 'Deployment' },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: approvalStateOptions, default: 'No Response' },

    approvalType: { type: String, enum: approvalTypeOptions },
    request: { type: String, enum: requestTypeOptions },
  },
  {
    timestamps: true,
  }
)

const RequestModel = model<Request>('Request', RequestSchema)
export default RequestModel
