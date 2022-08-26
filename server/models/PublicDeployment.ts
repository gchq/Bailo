import { Schema, model, Document, Types } from 'mongoose'
import logger from '../utils/logger'
import { ModelDoc } from './Model'
import { UserDoc } from './User'
import { VersionDoc } from './Version'

export interface LogStatement {
  timestamp: Date
  level: string
  msg: string
}

export interface PublicDeployment {
  uuid: string

  model: Types.ObjectId | ModelDoc
  version: Types.ObjectId | VersionDoc

  logs: Types.Array<LogStatement>
  built: boolean

  owner: Types.ObjectId | UserDoc

  createdAt: Date
  updatedAt: Date

  log: (level: string, msg: string) => Promise<void>
}

export type PublicDeploymentDoc = PublicDeployment & Document<any, any, PublicDeployment>

const PublicDeploymentSchema = new Schema<PublicDeployment>(
  {
    uuid: { type: String, required: true, index: true, unique: true },

    model: { type: Schema.Types.ObjectId, ref: 'Model' },
    version: { type: Schema.Types.ObjectId, ref: 'Version', unique: true },

    logs: [{ timestamp: Date, level: String, msg: String }],
    built: { type: Boolean, required: true, default: false },

    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  {
    timestamps: true,
  }
)

PublicDeploymentSchema.methods.log = async function (level: string, msg: string) {
  logger[level]({ deploymentId: this._id }, msg)
  await PublicDeploymentModel.findOneAndUpdate(
    { _id: this._id },
    { $push: { logs: { timestamp: new Date(), level, msg } } }
  )
}

export async function createIndexes() {
  PublicDeploymentSchema.index({ '$**': 'text' })
  await PublicDeploymentModel.createIndexes()
}

const PublicDeploymentModel = model<PublicDeployment>('PublicDeployment', PublicDeploymentSchema)
export default PublicDeploymentModel
