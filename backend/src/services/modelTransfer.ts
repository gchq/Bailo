import { ObjectId } from 'mongoose'

import ModelTransferModel, {
  ModelTransferInterface,
  TransferStatus,
  TransferStatusKeys,
} from '../models/ModelTransfer.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { NotFound } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { completeImportNotification, failImportNotification, startImportNotification } from './smtp/smtp.js'
import { sendWebhooks } from './webhook.js'

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

export async function updateFile(
  exportId: string,
  file: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface | null> {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    {
      $set: { [`fileStatus.${file}`]: status },
    },
    { new: true },
  )

  if (!updated) {
    log.warn({ exportId, file }, 'The requested model transfer was not found.')
    return null
  }

  return updated.toObject()
}

export async function updateImage(
  exportId: string,
  image: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface | null> {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    {
      $set: {
        [`imageStatus.${image}`]: status,
      },
    },
    { new: true },
  )

  if (!updated) {
    log.warn({ exportId, image }, 'The requested model transfer was not found.')
    return null
  }

  return updated.toObject()
}

export async function upsertArtefacts(
  exportId: string,
  images?: string[],
  files?: ObjectId[],
): Promise<ModelTransferInterface | null> {
  const setUpdates: Record<string, any> = {
    documentStatus: TransferStatus.Completed,
  }

  const addKey = (path: string) => {
    setUpdates[path] = {
      $ifNull: [`$${path}`, TransferStatus.InProgress],
    }
  }

  if (images) {
    for (const image of images) {
      addKey(`imageStatus.${image}`)
    }
  }

  if (files) {
    for (const file of files) {
      addKey(`fileStatus.${file}`)
    }
  }

  return ModelTransferModel.findOneAndUpdate({ exportId }, [{ $set: setUpdates }], { new: true })
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

export async function beginTransfer(
  exportId: string,
  modelId: string,
  createdBy: string,
  peerId?: string,
): Promise<void> {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    { exportId, modelId, peerId, createdBy },
    { new: true, setDefaultsOnInsert: true, upsert: true },
  )

  if (updated && !updated.startedNotificationSent) {
    const updated = await ModelTransferModel.findOneAndUpdate(
      { exportId },
      { startedNotificationSent: true },
      { new: true },
    )
    if (updated) {
      await startImportNotification(modelId)
    }
  }
}

export async function finishTransfer(exportId: string): Promise<void> {
  const transfer = await ModelTransferModel.findOne({
    exportId,
  })

  if (!transfer || !transfer.completed || transfer.completedNotificationSent) {
    return
  }

  const successfulFiles = [...transfer.fileStatus.entries()]
    .filter(([_filePath, status]) => status === TransferStatus.Completed)
    .map(([filePath]) => filePath)

  const successfulImages = [...transfer.imageStatus.entries()]
    .filter(([_distributionPackageName, status]) => status === TransferStatus.Completed)
    .map(([distributionPackageName]) => distributionPackageName)

  if (transfer?.status === TransferStatus.Completed) {
    const updated = await ModelTransferModel.findOneAndUpdate(
      { exportId },
      { completedNotificationSent: true },
      { new: true },
    )
    if (updated) {
      await completeImportNotification(transfer.modelId, successfulFiles, successfulImages)
      sendWebhooks(transfer.modelId, WebhookEvent.ImportModel, `Model ${transfer.modelId} has been imported.`, {
        transfer,
      })
    }
  }

  if (transfer.status === TransferStatus.Failed) {
    const failedFiles = [...transfer.fileStatus.entries()]
      .filter(([_filePath, status]) => status === TransferStatus.Failed)
      .map(([filePath]) => filePath)

    const failedImages = [...transfer.imageStatus.entries()]
      .filter(([_distributionPackageName, status]) => status === TransferStatus.Failed)
      .map(([distributionPackageName]) => distributionPackageName)

    const updated = await ModelTransferModel.findOneAndUpdate(
      { exportId },
      { completedNotificationSent: true },
      { new: true },
    )
    if (updated) {
      await failImportNotification(transfer.modelId, failedFiles, failedImages, successfulFiles, successfulImages)
      sendWebhooks(transfer.modelId, WebhookEvent.ImportModel, `Model ${transfer.modelId} has failed to import.`, {
        transfer,
      })
    }
  }
}
