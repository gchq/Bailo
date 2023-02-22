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

export const approvalCategoryOptions = ['Upload', 'Deployment']

export enum ApprovalCategory {
  Upload = 'Upload',
  Deployment = 'Deployment',
}

export interface Approval {
  version: Types.ObjectId | VersionDoc | undefined
  deployment: Types.ObjectId | DeploymentDoc | undefined

  approvers: Array<Entity>
  status: ApprovalStates

  approvalType: ApprovalTypes
  approvalCategory: ApprovalCategory

  createdAt: Date
  updatedAt: Date
}

export type ApprovalDoc = Approval & Document<any, any, Approval>

const ApprovalSchema = new Schema<Approval>(
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
    approvalCategory: { type: String, enum: approvalCategoryOptions },
  },
  {
    timestamps: true,
  }
)

ApprovalSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const ApprovalModel = model<Approval>('Approval', ApprovalSchema)
export default ApprovalModel
