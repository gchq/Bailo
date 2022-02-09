import { Schema, model } from 'mongoose'
import logger from '../utils/logger'
import { approvalStates } from './Request'

const VersionSchema = new Schema(
  {
    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    version: { type: String, required: true },

    metadata: { type: Schema.Types.Mixed },

    built: { type: Boolean, default: false },
    managerApproved: { type: String, required: true, enum: approvalStates, default: 'No Response' },
    reviewerApproved: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    state: { type: Schema.Types.Mixed, default: {} },
    logs: [{ timestamp: Date, level: String, msg: String }],
  },
  {
    timestamps: true,
  }
)

VersionSchema.index({ model: 1, version: 1 }, { unique: true })

VersionSchema.methods.log = async function (level: string, msg: string) {
  logger[level]({ versionId: this._id }, msg)
  await VersionModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const VersionModel = model('Version', VersionSchema)
export default VersionModel
