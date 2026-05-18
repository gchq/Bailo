import { ObjectId } from 'mongoose'

import ModelTransferModel, {
  ModelTransferInterface,
  TransferArtefactStatus,
  TransferStatus,
  TransferStatusKeys,
} from '../models/ModelTransfer.js'
import { UserInterface } from '../models/User.js'
import { MirrorKind, MirrorKindKeys } from '../types/types.js'
import { NotFound } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { startImportNotification, transferCompleteNotification } from './smtp/smtp.js'

export async function findModelTransferById(user: UserInterface, exportId: string): Promise<ModelTransferInterface> {
  const transfer = await ModelTransferModel.findOne({
    exportId,
  }).lean<ModelTransferInterface>()

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { exportId })
  }

  const modelId = transfer.modelId

  // Check user is authorised to get the Model
  await getModelById(user, modelId)

  return transfer
}

export async function findModelTransfersByModelId(
  user: UserInterface,
  modelId: string,
): Promise<ModelTransferInterface[]> {
  // Check user is authorised to get the Model
  await getModelById(user, modelId)

  const transfers = await ModelTransferModel.find({
    modelId,
  })
    .sort({ createdAt: -1 })
    .lean<ModelTransferInterface[]>()

  if (transfers.length === 0) {
    throw NotFound('No model transfers found.', { modelId })
  }

  return transfers
}

export async function createModelTransfer(input: {
  exportId: string
  modelId: string
  peerId?: string
  createdBy: string
}): Promise<ModelTransferInterface> {
  const transfer = new ModelTransferModel(input)
  await transfer.save()
  return transfer.toObject()
}

export async function updateModelTransfer(
  exportId: string,
  transferDiff: Partial<ModelTransferInterface>,
): Promise<ModelTransferInterface> {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    { $set: transferDiff },
    { new: true },
  ).lean<ModelTransferInterface>()

  if (!updated) {
    throw NotFound('The requested model transfer was not found.', { exportId })
  }

  return updated
}

export async function updateArtefactTransferStatus(
  exportId: string,
  image: string,
  kind: MirrorKindKeys,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface | null> {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId, 'artefactStatus.key': image, 'artefactStatus.kind': kind },
    {
      $set: { 'artefactStatus.$.status': status },
    },
    { new: true },
  )

  if (!updated) {
    const added = await ModelTransferModel.findOneAndUpdate(
      { exportId },
      {
        $push: { artefactStatus: { key: image, status, kind } },
      },
      { new: true },
    )

    if (!added) {
      log.warn({ exportId, image }, 'The requested model transfer was not found.')
      return null
    }

    return added.toObject()
  }

  await handleCompleteEmail(exportId)

  return updated.toObject()
}

export async function updateArtefactsTransferStatus(
  exportId: string,
  images?: string[],
  files?: ObjectId[],
): Promise<ModelTransferInterface | null> {
  await ModelTransferModel.findOneAndUpdate(
    { exportId, 'artefactStatus.key': 'documents', 'artefactStatus.kind': MirrorKind.Documents },
    {
      $set: { 'artefactStatus.$.status': TransferStatus.Completed },
    },
  )

  const artefactsToAdd: any[] = []

  if (images && images.length > 0) {
    artefactsToAdd.push(
      ...images.map((image) => ({ key: image, status: TransferStatus.InProgress, kind: MirrorKind.Image })),
    )
  }

  if (files && files.length > 0) {
    artefactsToAdd.push(
      ...files.map((file) => ({ key: file.toString(), status: TransferStatus.InProgress, kind: MirrorKind.File })),
    )
  }

  if (artefactsToAdd.length > 0) {
    await ModelTransferModel.findOneAndUpdate({ exportId }, [
      {
        $set: {
          artefactStatus: {
            $concatArrays: [
              '$artefactStatus',
              {
                $filter: {
                  input: artefactsToAdd,
                  cond: { $not: { $in: ['$$this.key', '$artefactStatus.key'] } },
                },
              },
            ],
          },
        },
      },
    ])
  }

  await handleCompleteEmail(exportId)

  return ModelTransferModel.findOneAndUpdate({ exportId }, {}, { new: true })
}

export async function deleteModelTransfer(exportId: string): Promise<string> {
  const transfer = await ModelTransferModel.findOne({
    exportId,
  })

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { exportId })
  }

  await transfer.delete()

  return transfer.exportId
}

export async function handleStartEmail(exportId: string, modelId: string, createdBy: string, peerId?: string) {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    { exportId, modelId, peerId, createdBy },
    { upsert: true, setDefaultsOnInsert: true },
  )

  if (!updated) {
    await startImportNotification(modelId)
  }
}

function filterArtefactsByKindAndStatus(
  artefactStatus: TransferArtefactStatus[],
  kind: MirrorKindKeys,
  status: TransferStatusKeys,
): string[] {
  return artefactStatus.filter((item) => item.kind === kind && item.status === status).map((item) => item.key)
}

async function handleCompleteEmail(exportId: string) {
  const transfer = await ModelTransferModel.findOne({
    exportId,
  })

  if (!transfer) {
    log.warn({ exportId }, 'The requested model transfer was not found')
    return
  }

  if (!transfer.completed || transfer.completedNotificationSent) {
    return
  }

  const artefacts = {
    'Failed Files': filterArtefactsByKindAndStatus(transfer.artefactStatus, MirrorKind.File, TransferStatus.Failed),
    'Failed Images': filterArtefactsByKindAndStatus(transfer.artefactStatus, MirrorKind.Image, TransferStatus.Failed),
    'Successful Files': filterArtefactsByKindAndStatus(
      transfer.artefactStatus,
      MirrorKind.File,
      TransferStatus.Completed,
    ),
    'Successful Images': filterArtefactsByKindAndStatus(
      transfer.artefactStatus,
      MirrorKind.Image,
      TransferStatus.Completed,
    ),
  }

  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    { completedNotificationSent: true },
    { new: true },
  )
  if (updated) {
    await transferCompleteNotification(transfer.modelId, transfer.status === TransferStatus.Failed, artefacts)
  }
}
