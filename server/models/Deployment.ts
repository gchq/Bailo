import { Document, model, Schema, Types } from 'mongoose'
import MongooseDelete from 'mongoose-delete'
import logger from '../utils/logger'
import { ModelDoc } from './Model'
import { ApprovalStates, approvalStateOptions, DeploymentMetadata } from '../../types/interfaces'

export interface LogStatement {
  timestamp: Date
  level: string
  msg: string
}

export interface Deployment {
  schemaRef: string | null
  uuid: string

  model: Types.ObjectId | ModelDoc
  metadata: DeploymentMetadata

  managerApproved: ApprovalStates

  logs: Types.Array<LogStatement>
  built: boolean
  ungoverned: boolean

  createdAt: Date
  updatedAt: Date

  log: (level: string, msg: string) => Promise<void>
}

export type DeploymentDoc = Deployment & Document<any, any, Deployment>

const DeploymentSchema = new Schema<Deployment>(
  {
    schemaRef: { type: String },
    uuid: { type: String, required: true, index: true, unique: true },

    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    metadata: { type: Schema.Types.Mixed },

    managerApproved: { type: String, required: true, enum: approvalStateOptions, default: 'No Response' },

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

DeploymentSchema.methods.log = async function log(level: string, msg: string) {
  logger[level]({ deploymentId: this._id }, msg)
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await DeploymentModel.findOneAndUpdate({ _id: this._id }, { $push: { logs: { timestamp: new Date(), level, msg } } })
}

const DeploymentModel = model<Deployment>('Deployment', DeploymentSchema)

export default DeploymentModel
