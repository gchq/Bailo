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
  exportId: string
  modelId: string
  peerId: string | undefined
  documentStatus: TransferStatusKeys
  fileStatus: Map<string, TransferStatusKeys>
  imageStatus: Map<string, TransferStatusKeys>
  startedNotificationSent: boolean
  completedNotificationSent: boolean
  failedNotificationSent: boolean
  completed: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface ModelTransferVirtuals {
  status: TransferStatusKeys
}

export type ModelTransferDoc = ModelTransferInterface & ModelTransferVirtuals & SoftDeleteDocument

const ModelTransferSchema = new Schema<ModelTransferDoc>(
  {
    exportId: { type: String, required: true, unique: true },
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

    startedNotificationSent: {
      type: Boolean,
      required: true,
      default: false,
    },

    completedNotificationSent: {
      type: Boolean,
      required: true,
      default: false,
    },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_model_transfers',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  },
)

// TODO: Use access request status to infer 'requested' and 'denied' status'
ModelTransferSchema.virtual('status').get(function (): TransferStatusKeys {
  const fileStatuses = Array.from(this.fileStatus.values())
  const imageStatuses = Array.from(this.imageStatus.values())
  const allStatuses = [this.documentStatus, ...fileStatuses, ...imageStatuses]

  if (allStatuses.includes(TransferStatus.Failed)) {
    return TransferStatus.Failed
  }

  const fullyComplete =
    this.documentStatus === TransferStatus.Completed &&
    fileStatuses.every((status) => status === TransferStatus.Completed) &&
    imageStatuses.every((status) => status === TransferStatus.Completed)

  return fullyComplete ? TransferStatus.Completed : TransferStatus.InProgress
})

ModelTransferSchema.virtual('completed').get(function (): boolean {
  const fileStatuses = Array.from(this.fileStatus.values())
  const imageStatuses = Array.from(this.imageStatus.values())

  return (
    this.documentStatus !== TransferStatus.InProgress &&
    fileStatuses.every((status) => status !== TransferStatus.InProgress) &&
    imageStatuses.every((status) => status !== TransferStatus.InProgress)
  )
})

ModelTransferSchema.index({ modelId: 1, createdAt: -1 })
ModelTransferSchema.index({ exportId: 1, createdAt: -1 })

ModelTransferSchema.plugin(softDeletionPlugin)

const ModelTransferModel = model<ModelTransferDoc>('ModelTransfer', ModelTransferSchema)
export default ModelTransferModel
