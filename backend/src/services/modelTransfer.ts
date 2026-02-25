import { Types } from 'mongoose'

import ModelTransferModel, { ModelTransferInterface, TransferStatusKeys } from '../models/ModelTransfer.js'
import { BadReq, NotFound } from '../utils/error.js'

function assertValidObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) {
    throw BadReq('Invalid transfer id', { transferId: id })
  }
}

export async function findModelTransferById(transferId: string): Promise<ModelTransferInterface> {
  assertValidObjectId(transferId)

  const transfer = await ModelTransferModel.findOne({
    _id: transferId,
    deletedAt: { $exists: false },
  })

  if (!transfer) {
    throw NotFound('The requested model transfer was not found.', { transferId })
  }

  return transfer
}

export async function createModelTransfer(input: {
  modelId: string
  status: TransferStatusKeys
  createdBy: string
}): Promise<ModelTransferInterface> {
  const created = await ModelTransferModel.create(input)
  return created.toObject()
}

export async function updateModelTransferStatus(
  transferId: string,
  status: TransferStatusKeys,
): Promise<ModelTransferInterface> {
  assertValidObjectId(transferId)
  const updated = await ModelTransferModel.findOneAndUpdate(
    { _id: transferId, deletedAt: { $exists: false } },
    { status },
    { new: true },
  ).lean()

  if (!updated) {
    throw NotFound('The requested model transfer was not found.', { transferId })
  }

  return updated
}

export async function deleteModelTransfer(transferId: string): Promise<void> {
  assertValidObjectId(transferId)
  const result = await ModelTransferModel.findOneAndUpdate({ _id: transferId }, { deletedAt: new Date() })

  if (!result) {
    throw NotFound('The requested model transfer was not found.', { transferId })
  }
}
