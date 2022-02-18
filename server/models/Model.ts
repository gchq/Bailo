import { Schema, model } from 'mongoose'
import createAuthPlugin from '../utils/mongooseAuth'
import Authorisation from '../external/Authorisation'

const authorisation = new Authorisation()

const ModelSchema = new Schema(
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

ModelSchema.plugin(createAuthPlugin(authorisation.canUserSeeModel))

const ModelModel = model('Model', ModelSchema)
ModelModel.createIndexes()

export default ModelModel
