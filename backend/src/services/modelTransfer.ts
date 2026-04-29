import { Types } from 'mongoose'

import ModelTransferModel, { ModelTransferInterface, TransferStatusKeys } from '../models/ModelTransfer.js'
import { UserInterface } from '../models/User.js'
import { BadReq, NotFound } from '../utils/error.js'
import { getModelById } from './model.js'

function assertValidObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw BadReq('Invalid object id', { objectId: id })
  }
}

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
  exportId: string,
): Promise<ModelTransferInterface[]> {
  // Check user is authorised to get the Model
  await getModelById(user, exportId)

  const transfers = await ModelTransferModel.find({
    exportId: exportId,
  }).sort({ createdAt: -1 })

  if (transfers.length === 0) {
    throw NotFound('No model transfers found.', { exportId })
  }

  return transfers
}

export async function createModelTransfer(input: {
  exportId: string
  modelId: string
  peerId: string
  status: TransferStatusKeys
  createdBy: string
}): Promise<ModelTransferInterface> {
  const transfer = new ModelTransferModel(input)
  await transfer.save()
  return transfer.toObject()
}

export async function updateModelTransfer(
  exportId: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface> {
  assertValidObjectId(exportId)
  const updated = await ModelTransferModel.findOneAndUpdate({ exportId }, { status }, { new: true })

  if (!updated) {
    throw NotFound('The requested model transfer was not found.', { exportId })
  }

  return updated
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
