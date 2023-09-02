import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { ApprovalKind, ApprovalKindKeys } from '../../types/v2/enums.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ApprovalRequestInterface {
  model: string
  release: string
  kind: ApprovalKindKeys
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ApprovalRequestDoc = ApprovalRequestInterface & Document<any, any, ApprovalRequestInterface>

const ApprovalRequestSchema = new Schema<ApprovalRequestInterface>(
  {
    model: { type: String, required: true },
    release: { type: String, required: true },
    kind: { type: String, enum: Object.values(ApprovalKind), required: true },
    isActive: { type: Boolean, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_approvals',
  },
)

ApprovalRequestSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
})

const ApprovalRequestModel = model<ApprovalRequestInterface>('v2_Approval', ApprovalRequestSchema)

export default ApprovalRequestModel
