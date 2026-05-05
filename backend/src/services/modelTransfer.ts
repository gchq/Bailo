import { ObjectId } from 'mongoose'

import ModelTransferModel, {
  ModelTransferInterface,
  TransferStatus,
  TransferStatusKeys,
} from '../models/ModelTransfer.js'
import { UserInterface } from '../models/User.js'
import { NotFound } from '../utils/error.js'
import { useTransaction } from '../utils/transactions.js'
import { getModelById } from './model.js'
import { completeImportNotification, failImportNotification, startImportNotification } from './smtp/smtp.js'

export async function findModelTransferById(user: UserInterface, exportId: string): Promise<ModelTransferInterface> {
  const transfer = await ModelTransferModel.findOne({
    exportId,
  })

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
  }).sort({ createdAt: -1 })

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
  const updated = await ModelTransferModel.findOneAndUpdate({ exportId }, { transferDiff }, { new: true })

  if (!updated) {
    throw NotFound('The requested model transfer was not found.', { exportId })
  }

  return updated
}

export async function updateFile(
  exportId: string,
  file: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface> {
  return ModelTransferModel.findOneAndUpdate(
    { exportId },
    {
      $set: { [`fileStatus.${file}`]: status },
    },
    { new: true, upsert: true },
  )
}

export async function updateImage(
  exportId: string,
  image: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface> {
  return ModelTransferModel.findOneAndUpdate(
    { exportId },
    {
      $set: { [`imageStatus.${image}`]: status },
    },
    { new: true, upsert: true },
  )
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

  return transfer.id
}

export async function beginTransfer(exportId: string, modelId: string, createdBy: string, peerId?: string) {
  const updated = await ModelTransferModel.findOneAndUpdate(
    { exportId },
    { exportId, modelId, peerId, createdBy },
    { new: true, setDefaultsOnInsert: true, upsert: true },
  )

  if (updated && !updated.startedNotificationSent) {
    await useTransaction([
      async (session) => {
        await startImportNotification(modelId, [])
        return await ModelTransferModel.updateOne({ exportId }, { startedNotificationSent: true }, { session })
      },
    ])
  }
}

export async function finishTransfer(exportId: string) {
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
    await useTransaction([
      async (session) => {
        await completeImportNotification(transfer.modelId, successfulFiles, successfulImages)
        return await ModelTransferModel.updateOne({ exportId }, { completedNotificationSent: true }, { session })
      },
    ])
  }

  if (transfer.status === TransferStatus.Failed) {
    const failedFiles = [...transfer.fileStatus.entries()]
      .filter(([_filePath, status]) => status === TransferStatus.Completed)
      .map(([filePath]) => filePath)

    const failedImages = [...transfer.imageStatus.entries()]
      .filter(([_distributionPackageName, status]) => status === TransferStatus.Completed)
      .map(([distributionPackageName]) => distributionPackageName)

    await useTransaction([
      async (session) => {
        await failImportNotification(transfer.modelId, failedFiles, failedImages, successfulFiles, successfulImages)
        return await ModelTransferModel.updateOne({ exportId }, { completedNotificationSent: true }, { session })
      },
    ])
  }
}
