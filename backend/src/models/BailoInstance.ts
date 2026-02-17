import { model, ObjectId, Schema } from 'mongoose'

import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface BailoInstanceInterface {
  _id: ObjectId

  // Bailo instance id
  instanceId: string

  // System proc user ids
  userIds: string[]
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type BailoInstanceDoc = BailoInstanceInterface & SoftDeleteDocument

const BailoInstanceSchema = new Schema<BailoInstanceDoc>(
  {
    instanceId: { type: String, required: true },
    userIds: [{ type: String, required: true }],
  },
  {
    timestamps: true,
    collection: 'v2_allowed_bailo_instances',
  },
)

BailoInstanceSchema.plugin(softDeletionPlugin)

const BailoInstanceModel = model<BailoInstanceDoc>('v2_Allowed_Bailo_Instance', BailoInstanceSchema)

export default BailoInstanceModel
