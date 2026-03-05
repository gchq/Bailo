import { model, Schema } from 'mongoose'

import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export const TransferStatus = {
  Requested: 'requested',
  Denied: 'denied',
  InProgress: 'in_progress',
  Failed: 'failed',
  Completed: 'completed',
} as const
export type TransferStatusKeys = (typeof TransferStatus)[keyof typeof TransferStatus]

export interface ModelTransferInterface {
  _id: string
  modelId: string
  // The Bailo instance ID where the model is being transferred from
  peerId: string
  status: TransferStatusKeys
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface

export type ModelTransferDoc = ModelTransferInterface & SoftDeleteDocument

const ModelTransferSchema = new Schema<ModelTransferDoc>(
  {
    modelId: { type: String, required: true },
    peerId: { type: String, required: true },
    status: { type: String, enum: Object.values(TransferStatus), required: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_model_transfers',
  },
)

ModelTransferSchema.plugin(softDeletionPlugin)

// For GET transfers by modelId queries
ModelTransferSchema.index({ modelId: 1 })

const ModelTransferModel = model<ModelTransferDoc>('v2_Model_Transfer', ModelTransferSchema)

export default ModelTransferModel
