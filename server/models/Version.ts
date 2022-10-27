import mongoose, { Document, IndexOptions, model, Schema, Types } from 'mongoose'
import logger from '../utils/logger'
import { LogStatement } from './Deployment'
import { approvalStateOptions, ApprovalStates, DateString } from '../../types/interfaces'
import { ModelDoc } from './Model'
import { Version } from '../../types/models/version'

const VersionSchema = new Schema<Version>(
  {
    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    version: { type: String, required: true },

    metadata: { type: Schema.Types.Mixed },

    files: { type: Schema.Types.Mixed, required: true, default: {} },

    built: { type: Boolean, default: false },
    managerApproved: { type: String, required: true, enum: ApprovalStates, default: ApprovalStates.NoResponse },
    reviewerApproved: { type: String, required: true, enum: ApprovalStates, default: ApprovalStates.NoResponse },
    managerLastViewed: { type: Date },
    reviewerLastViewed: { type: Date },

    state: { type: Schema.Types.Mixed, default: {} },
    logs: [{ timestamp: Date, level: String, msg: String }],
  },
  {
    timestamps: true,
  }
)

VersionSchema.index({ model: 1, version: 1 }, { unique: true })

VersionSchema.methods.log = async function log(level: string, msg: string) {
  logger[level]({ versionId: this._id }, msg)
  await mongoose
    .model('Version')
    .findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const VersionModel = model<Version>('Version', VersionSchema)

export default VersionModel
