import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { Entity } from '../../types/types.js'

export const ModelVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type ModelVisibilityKeys = (typeof ModelVisibility)[keyof typeof ModelVisibility]

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ModelInterface {
  id: string

  name: string
  description: string

  visibility: ModelVisibilityKeys
  deleted: boolean

  entities: Entity[]

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelDoc = ModelInterface & Document<any, any, ModelInterface>

const ModelSchema = new Schema<ModelInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },
    description: { type: String, required: true },

    visibility: { type: String, enum: Object.values(ModelVisibility), default: ModelVisibility.Public },

    entities: [{ type: Object }],
  },
  {
    timestamps: true,
    collection: 'v2_models',
  }
)

ModelSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const ModelModel = model<ModelInterface>('v2_Model', ModelSchema)

export default ModelModel
