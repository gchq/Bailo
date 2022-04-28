import { Schema, model, Document, Types } from 'mongoose'
import { UserDoc } from './User'
import { VersionDoc } from './Version'

export interface Model {
  schemaRef: string
  uuid: string

  parent: ModelDoc
  versions: Types.Array<VersionDoc | Types.ObjectId>
  currentMetadata: any

  owner: UserDoc | Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

export type ModelDoc = Model & Document<any, any, Model>

const ModelSchema = new Schema<Model>(
  {
    schemaRef: { type: String, required: true },
    uuid: { type: String, required: true, index: true, unique: true },

    parent: { type: Schema.Types.ObjectId, ref: 'Model' },
    versions: [{ type: Schema.Types.ObjectId, ref: 'Version' }],
    currentMetadata: { type: Schema.Types.Mixed },

    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  {
    timestamps: true,
  }
)

const ModelModel = model<Model>('Model', ModelSchema)

export async function createIndexes() {
  ModelSchema.index({ '$**': 'text' })
  await ModelModel.createIndexes()
}

export default ModelModel
