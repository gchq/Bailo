import { model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { Approval, ApprovalCategory, ApprovalStates, ApprovalTypes, EntityKind } from '../types/types.js'

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
    status: { type: String, required: true, enum: Object.values(ApprovalStates), default: ApprovalStates.NoResponse },

    approvalType: { type: String, enum: Object.values(ApprovalTypes) },
    approvalCategory: { type: String, enum: Object.values(ApprovalCategory) },
  },
  {
    timestamps: true,
  }
)

ApprovalSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const ApprovalModel = model<Approval>('Approval', ApprovalSchema)
export default ApprovalModel
