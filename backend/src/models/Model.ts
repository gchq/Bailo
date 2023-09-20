import { model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { Model } from '../types/types.js'

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

export async function createModelIndexes() {
  ModelSchema.index({ '$**': 'text' })
  await ModelModel.createIndexes()
}

export default ModelModel
