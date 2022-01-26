import { Schema, model } from 'mongoose'
import { approvalStates } from './Request'
import logger from '../utils/logger'

const DeploymentSchema = new Schema(
  {
    schemaRef: { type: String, required: true },
    uuid: { type: String, required: true, index: true, unique: true },

    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    metadata: { type: Schema.Types.Mixed },

    managerApproved: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    logs: [{ timestamp: Date, level: String, msg: String }],
    built: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  {
    timestamps: true,
  }
)

DeploymentSchema.methods.log = async function (level: string, msg: string) {
  logger[level]({ deploymentId: this._id }, msg)
  await DeploymentModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const DeploymentModel = model('Deployment', DeploymentSchema)
export default DeploymentModel
