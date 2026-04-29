import { InferSchemaType, model, Schema } from 'mongoose'

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
  exportId: string
  modelId: string
  // The Bailo instance ID where the model is being transferred from
  peerId: string | undefined
  documentStatus: TransferStatusKeys

  fileStatus: Map<string, TransferStatusKeys>
  imageStatus: Map<string, TransferStatusKeys>
  notificationSent: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface ModelTransferVirtuals {
  status: TransferStatusKeys
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface

export type ModelTransferDoc = ModelTransferInterface & ModelTransferVirtuals & SoftDeleteDocument

const ModelTransferSchema = new Schema<ModelTransferDoc>(
  {
    exportId: { type: String, required: true, index: true },
    modelId: { type: String, required: true },
    peerId: { type: String },

    documentStatus: {
      type: String,
      enum: Object.values(TransferStatus),
      required: true,
      default: TransferStatus.InProgress,
    },

    fileStatus: {
      type: Map,
      of: {
        type: String,
        enum: Object.values(TransferStatus),
      },
      required: true,
      default: {},
    },

    imageStatus: {
      type: Map,
      of: {
        type: String,
        enum: Object.values(TransferStatus),
      },
      required: true,
      default: {},
    },

    notificationSent: {
      type: Boolean,
      required: true,
      default: false,
    },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_model_transfers',
    toJSON: { getters: true },
  },
)

ModelTransferSchema.virtual('status').get(function (
  this: InferSchemaType<typeof ModelTransferSchema>,
): TransferStatusKeys {
  const fileStatuses = Array.from(this.fileStatus.values())
  const imageStatuses = Array.from(this.imageStatus.values())

  const allFilesComplete = fileStatuses.every((status) => status === TransferStatus.Completed)

  const allImagesComplete = imageStatuses.every((status) => status === TransferStatus.Completed)

  const fullyComplete = allFilesComplete && allImagesComplete && this.documentStatus === TransferStatus.Completed

  return fullyComplete ? TransferStatus.Completed : TransferStatus.InProgress
})

ModelTransferSchema.plugin(softDeletionPlugin)

// For GET transfers by modelId queries
ModelTransferSchema.index({ modelId: 1, createdAt: -1 })

const ModelTransferModel = model<ModelTransferDoc>('v2_Model_Transfer', ModelTransferSchema)

export default ModelTransferModel
