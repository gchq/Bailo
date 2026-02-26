import { Types } from 'mongoose'
import { describe, expect, test, vi } from 'vitest'

import { TransferStatus } from '../../src/models/ModelTransfer.js'
import {
  createModelTransfer,
  deleteModelTransfer,
  findModelTransferById,
  updateModelTransfer,
} from '../../src/services/modelTransfer.js'
import { BadReq, NotFound } from '../../src/utils/error.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const ModelTransferModelMock = getTypedModelMock('ModelTransferModel')

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', async () => modelMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

describe('services > modelTransfer', () => {
  const validObjectId = new Types.ObjectId().toHexString()
  const invalidObjectId = '001'

  test('findModelTransferById > throws BadReq for invalid ObjectId', async () => {
    ModelTransferModelMock.findOne.mockImplementation(() => {
      throw BadReq('Invalid transfer id.', { transferId: 'test' })
    })

    const res = findModelTransferById(invalidObjectId)

    await expect(res).rejects.toThrowError(/^Invalid transfer id/)
  })

  test('findModelTransferById > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockImplementation(() => {
      throw NotFound('The requested model transfer was not found.', { transferId: 'test' })
    })

    const res = findModelTransferById(validObjectId)

    await expect(res).rejects.toThrowError(/^The requested model transfer was not found/)
  })

  test('findModelTransferById > returns transfer when found', async () => {
    const transfer = { _id: validObjectId, status: TransferStatus.InProgress }

    ModelTransferModelMock.findOne.mockResolvedValue(transfer)

    const result = await findModelTransferById(validObjectId)

    expect(result).toEqual(transfer)
  })

  test('createModelTransfer > creates and returns transfer', async () => {
    const input = {
      modelId: 'model-123',
      status: TransferStatus.Requested,
      createdBy: 'user:test',
    }

    const instance = {
      _id: 'mock-id',
      ...input,
      save: vi.fn().mockResolvedValue(undefined),
    }

    ModelTransferModelMock.mockImplementationOnce(function () {
      return instance as any
    })

    const result = await createModelTransfer(input)

    expect(ModelTransferModelMock).toHaveBeenCalledWith(input)
    expect(instance.save).toHaveBeenCalled()
    expect(result).toEqual(instance)
  })

  test('updateModelTransferStatus > throws BadReq for invalid ObjectId', async () => {
    const res = updateModelTransfer('001', TransferStatus.Completed)

    await expect(res).rejects.toThrowError(/^Invalid transfer id/)
  })

  test('updateModelTransferStatus > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => {
      return {
        lean: vi.fn(() => {
          throw NotFound('The requested model transfer was not found.', { transferId: 'test' })
        }),
      }
    })

    const res = updateModelTransfer(validObjectId, TransferStatus.Completed)

    await expect(res).rejects.toThrowError(/^The requested model transfer was not found/)
  })

  test('updateModelTransferStatus > updates and returns transfer', async () => {
    const updated = {
      _id: validObjectId,
      status: TransferStatus.Completed,
    }

    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => {
      return {
        lean: vi.fn().mockResolvedValue(updated),
      }
    })

    const result = await updateModelTransfer(validObjectId, TransferStatus.Completed)

    expect(ModelTransferModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: validObjectId },
      { status: TransferStatus.Completed },
      { new: true },
    )

    expect(result).toEqual(updated)
  })

  test('deleteModelTransfer > throws BadReq for invalid ObjectId', async () => {
    const res = deleteModelTransfer('001')

    await expect(res).rejects.toThrowError(/^Invalid transfer id/)
  })

  test('deleteModelTransfer > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(null)

    const res = deleteModelTransfer(validObjectId)

    await expect(res).rejects.toThrowError(/^The requested model transfer was not found/)
  })

  test('deleteModelTransfer > soft deletes transfer', async () => {
    const transfer = {
      _id: validObjectId,
      delete: vi.fn().mockResolvedValue(undefined),
    }

    ModelTransferModelMock.findOne.mockResolvedValue(transfer as any)

    const result = await deleteModelTransfer(validObjectId)

    expect(transfer.delete).toHaveBeenCalled()
    expect(result).toEqual(validObjectId)
  })
})
