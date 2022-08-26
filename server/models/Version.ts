import { Document, IndexOptions, model, Schema, Types } from 'mongoose'
import logger from '../utils/logger'
import { approvalStateOptions, ApprovalStates, LogStatement } from './Deployment'
import { ModelDoc } from './Model'

export interface Version {
  model: ModelDoc | Types.ObjectId
  version: string

  metadata: any

  built: boolean
  managerApproved: ApprovalStates
  reviewerApproved: ApprovalStates

  state: any
  logs: Types.Array<LogStatement>

  createdAt: Date
  updatedAt: Date

  log: (level: string, msg: string) => Promise<void>
}

export type VersionDoc = Version & Document<any, any, Version>

const VersionSchema = new Schema<Version>(
  {
    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    version: { type: String, required: true },

    metadata: { type: Schema.Types.Mixed },

    built: { type: Boolean, default: false },
    managerApproved: { type: String, required: true, enum: approvalStateOptions, default: 'No Response' },
    reviewerApproved: { type: String, required: true, enum: approvalStateOptions, default: 'No Response' },

    state: { type: Schema.Types.Mixed, default: {} },
    logs: [{ timestamp: Date, level: String, msg: String }],
  },
  {
    timestamps: true,
  }
)

VersionSchema.index({ model: 1, version: 1 }, { unique: true } as unknown as IndexOptions)

VersionSchema.methods.log = async function (level: string, msg: string) {
  logger[level]({ versionId: this._id }, msg)
  await VersionModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const VersionModel = model<Version>('Version', VersionSchema)
export default VersionModel
