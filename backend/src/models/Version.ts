import { IndexOptions, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { ApprovalStates, Version } from '../types/types.js'
import logger from '../utils/logger.js'

const VersionSchema = new Schema<Version>(
  {
    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    version: { type: String, required: true },

    metadata: { type: Schema.Types.Mixed },

    files: { type: Schema.Types.Mixed, required: true, default: {} },

    built: { type: Boolean, default: false },
    managerApproved: {
      type: String,
      required: true,
      enum: Object.values(ApprovalStates),
      default: ApprovalStates.NoResponse,
    },
    reviewerApproved: {
      type: String,
      required: true,
      enum: Object.values(ApprovalStates),
      default: ApprovalStates.NoResponse,
    },
    managerLastViewed: { type: Schema.Types.Mixed },
    reviewerLastViewed: { type: Schema.Types.Mixed },

    state: { type: Schema.Types.Mixed, default: {} },
    logs: [{ timestamp: Date, level: String, msg: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
)

VersionSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

VersionSchema.index({ model: 1, version: 1 }, { unique: true } as unknown as IndexOptions)

type Level = 'info' | 'error'
VersionSchema.methods.log = async function log(level: Level, msg: string) {
  logger[level]({ versionId: this._id }, msg)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await VersionModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const VersionModel = model<Version>('Version', VersionSchema)

export default VersionModel
