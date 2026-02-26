import { Types } from 'mongoose'

import ModelTransferModel, { ModelTransferInterface, TransferStatusKeys } from '../models/ModelTransfer.js'
import { BadReq, NotFound } from '../utils/error.js'

function assertValidObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw BadReq('Invalid transfer id', { transferId: id })
  }
}

export async function findModelTransferById(id: string): Promise<ModelTransferInterface> {
  assertValidObjectId(id)

  const transfer = await ModelTransferModel.findOne({
    _id: id,
  })

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { id })
  }

  return transfer
}

export async function createModelTransfer(input: {
  modelId: string
  status: TransferStatusKeys
  createdBy: string
}): Promise<ModelTransferInterface> {
  const transfer = new ModelTransferModel(input)
  await transfer.save()
  return transfer
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

  return transfer._id
}
