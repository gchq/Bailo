import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

export interface AccessRequestMetadata {
  overview: {
    name: string
    entities: Array<string>

    endDate?: string
    [x: string]: unknown
  }

  [x: string]: unknown
}

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface AccessRequestInterface {
  id: string
  modelId: string

  schemaId: string
  metadata: AccessRequestMetadata

  deleted: boolean

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface

export type AccessRequestDoc = AccessRequestInterface & SoftDeleteDocument

const AccessRequestSchema = new Schema<AccessRequestDoc>(
  {
    id: { type: String, unique: true, required: true },
    modelId: { type: String, required: true },

    schemaId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: true },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_access_requests',
  },
)

AccessRequestSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
  deletedAt: true,
})

const AccessRequestModel = model<AccessRequestDoc>('v2_Access_Request', AccessRequestSchema)

export default AccessRequestModel
