import { Document, model, Schema, Types } from 'mongoose'
import MongooseDelete from 'mongoose-delete'
import { DeploymentDoc } from './Deployment'
import { Entity, approvalStateOptions, ApprovalStates, EntityKind } from '../../types/interfaces'
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

  approvers: Array<Entity>
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

    approvers: [
      {
        kind: {
          type: String,
          enum: Object.values(EntityKind),
          required: true,
        },
        id: {
          type: String,
          required: true,
        },
      },
    ],
    status: { type: String, required: true, enum: approvalStateOptions, default: 'No Response' },

    approvalType: { type: String, enum: approvalTypeOptions },
    request: { type: String, enum: requestTypeOptions },
  },
  {
    timestamps: true,
  }
)

RequestSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const RequestModel = model<Request>('Request', RequestSchema)
export default RequestModel
