import { Document, model, Schema, Types } from 'mongoose'
import MongooseDelete from 'mongoose-delete'
import { VersionDoc } from './Version'

export interface Model {
  schemaRef: string
  uuid: string

  versions: Types.Array<VersionDoc | Types.ObjectId>
  latestVersion: VersionDoc | Types.ObjectId

  createdAt: Date
  updatedAt: Date
}

export type ModelDoc = Model & Document<any, any, Model>

const ModelSchema = new Schema<Model>(
  {
    schemaRef: { type: String, required: true },
    uuid: { type: String, required: true, index: true, unique: true },

    versions: [{ type: Schema.Types.ObjectId, ref: 'Version' }],
    latestVersion: { type: Schema.Types.ObjectId, ref: 'Version' },
  },
  {
    timestamps: true,
  }
)

ModelSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const ModelModel = model<Model>('Model', ModelSchema)

export async function createIndexes() {
  ModelSchema.index({ '$**': 'text' })
  await ModelModel.createIndexes()
}

export default ModelModel
