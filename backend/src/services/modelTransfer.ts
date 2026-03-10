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

export async function findModelTransferById(user: UserInterface, id: string): Promise<ModelTransferInterface> {
  assertValidObjectId(id)

  const transfer = await ModelTransferModel.findOne({
    _id: id,
  }).lean()

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { id })
  }

  const modelId = transfer.modelId

  // Check user is authorised to get the Model
  await getModelById(user, modelId)

  return transfer
}

export async function findModelTransfersByModelId(user: UserInterface, id: string): Promise<ModelTransferInterface[]> {
  // Check user is authorised to get the Model
  await getModelById(user, id)

  const transfers = await ModelTransferModel.find({
    modelId: id,
  })
    .sort({ createdAt: -1 })
    .lean()

  if (transfers.length === 0) {
    throw NotFound('No model transfers found.', { id })
  }

  return transfers
}

export async function createModelTransfer(input: {
  modelId: string
  peerId: string
  status: TransferStatusKeys
  createdBy: string
}): Promise<ModelTransferInterface> {
  const transfer = new ModelTransferModel(input)
  await transfer.save()
  return transfer.toObject()
}

export async function updateModelTransfer(id: string, status: TransferStatusKeys): Promise<ModelTransferInterface> {
  assertValidObjectId(id)
  const updated = await ModelTransferModel.findOneAndUpdate({ _id: id }, { status }, { new: true }).lean()

  if (!updated) {
    throw NotFound('The requested model transfer was not found.', { id })
  }

  return updated
}

export async function deleteModelTransfer(id: string): Promise<string> {
  assertValidObjectId(id)

  const transfer = await ModelTransferModel.findOne({
    _id: id,
  })

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { id })
  }

  await transfer.delete()

  return transfer.id
}
