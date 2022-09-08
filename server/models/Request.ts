import { Schema, model, Types, Document } from 'mongoose'
import MongooseDelete from 'mongoose-delete'
import { approvalStates, ApprovalStates, DeploymentDoc } from './Deployment'
import { VersionDoc } from './Version'
import { UserDoc } from './User'

export const approvalTypes = ['Manager', 'Reviewer']

export enum ApprovalTypes {
  Manager = 'Manager',
  Reviewer = 'Reviewer',
}

export const requestTypes = ['Upload', 'Deployment']

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

const RequestSchema: any = new Schema<Request>(
  {
    // ONE OF THESE TWO
    version: { type: Schema.Types.ObjectId, ref: 'Version' },
    deployment: { type: Schema.Types.ObjectId, ref: 'Deployment' },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    approvalType: { type: String, enum: approvalTypes },
    request: { type: String, enum: requestTypes },
  },
  {
    timestamps: true,
  }
)

RequestSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: String })

const RequestModel = model<Request>('Request', RequestSchema)
export default RequestModel
