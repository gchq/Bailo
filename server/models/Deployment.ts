import { Document, model, Schema, Types } from 'mongoose'
import logger from '../utils/logger'
import { ModelDoc } from './Model'
import { UserDoc } from './User'
import { VersionDoc } from './Version'

export const approvalStates = ['Accepted', 'Declined', 'No Response']

export enum ApprovalStates {
  Accepted = 'Accepted',
  Declined = 'Declined',
  NoResponse = 'No Response',
}

export interface LogStatement {
  timestamp: Date
  level: string
  msg: string
}

export interface Deployment {
  schemaRef: string
  uuid: string

  model: Types.ObjectId | ModelDoc
  versions: Types.Array<Types.ObjectId | VersionDoc>
  metadata: any

  managerApproved: ApprovalStates

  logs: Types.Array<LogStatement>
  built: boolean

  owner: Types.ObjectId | UserDoc

  createdAt: Date
  updatedAt: Date

  log: (level: string, msg: string) => Promise<void>
}

export type DeploymentDoc = Deployment & Document<any, any, Deployment>

const DeploymentSchema = new Schema<Deployment>(
  {
    schemaRef: { type: String, required: true },
    uuid: { type: String, required: true, index: true, unique: true },

    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    versions: [{ type: Schema.Types.ObjectId, ref: 'Version' }],
    metadata: { type: Schema.Types.Mixed },

    managerApproved: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    logs: [{ timestamp: Date, level: String, msg: String }],
    built: { type: Boolean, required: true, default: false },

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

const DeploymentModel = model<Deployment>('Deployment', DeploymentSchema)
export default DeploymentModel
