import { model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { ApprovalStates, Deployment } from '../types/types.js'
import logger from '../utils/logger.js'

const DeploymentSchema = new Schema<Deployment>(
  {
    schemaRef: { type: String },
    uuid: { type: String, required: true, index: true, unique: true },

    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    metadata: { type: Schema.Types.Mixed },

    managerApproved: {
      type: String,
      required: true,
      enum: Object.values(ApprovalStates),
      default: ApprovalStates.NoResponse,
    },

    logs: [{ timestamp: Date, level: String, msg: String }],
    built: { type: Boolean, required: true, default: false },
    ungoverned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

DeploymentSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
})

type Level = 'info' | 'error'

DeploymentSchema.methods.log = async function log(level: Level, msg: string) {
  logger[level]({ deploymentId: this._id }, msg)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await DeploymentModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const DeploymentModel = model<Deployment>('Deployment', DeploymentSchema)

export default DeploymentModel
