import { HydratedDocument, model, Schema } from 'mongoose'

import { MirrorKind, MirrorKindKeys } from '../types/types.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export const TransferStatus = {
  Requested: 'requested',
  Denied: 'denied',
  InProgress: 'in_progress',
  Failed: 'failed',
  Completed: 'completed',
} as const
export type TransferStatusKeys = (typeof TransferStatus)[keyof typeof TransferStatus]

export interface TransferArtefactStatus {
  key: string

  // Human readable name that is used for transfer progress
  name?: string
  status: TransferStatusKeys
  kind: MirrorKindKeys
}

export interface ModelTransferInterface {
  exportId: string
  modelId: string
  peerId?: string
  artefactStatus: TransferArtefactStatus[]
  completedNotificationSent: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface ModelTransferVirtuals {
  status: TransferStatusKeys
  completed: boolean
}

export type ModelTransferDoc = HydratedDocument<ModelTransferInterface & ModelTransferVirtuals> & SoftDeleteDocument

const ModelTransferSchema = new Schema<ModelTransferDoc>(
  {
    exportId: { type: String, required: true },
    modelId: { type: String, required: true },
    peerId: { type: String },

    artefactStatus: {
      type: [
        {
          key: { type: String, required: true },
          name: { type: String },
          status: {
            type: String,
            enum: Object.values(TransferStatus),
            required: true,
          },
          kind: { type: String, enum: Object.values(MirrorKind), required: true },
        },
      ],
      required: true,
      default: [{ key: MirrorKind.Documents, status: TransferStatus.InProgress, kind: MirrorKind.Documents }],
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
  const allStatuses = this.artefactStatus.map((item) => item.status)

  if (allStatuses.includes(TransferStatus.Failed)) {
    return TransferStatus.Failed
  }

  const fullyComplete = allStatuses.every((status) => status === TransferStatus.Completed)

  return fullyComplete ? TransferStatus.Completed : TransferStatus.InProgress
})

ModelTransferSchema.virtual('completed').get(function (): boolean {
  const allStatuses = this.artefactStatus.map((item) => item.status)

  return allStatuses.every((status) => status !== TransferStatus.InProgress)
})

ModelTransferSchema.index({ modelId: 1, createdAt: -1 })
ModelTransferSchema.index({ exportId: 1, createdAt: -1 })

ModelTransferSchema.plugin(softDeletionPlugin)

const ModelTransferModel = model<ModelTransferDoc>('v2_Model_Transfer', ModelTransferSchema)
export default ModelTransferModel
