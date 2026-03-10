import { Types } from 'mongoose'
import { describe, expect, test, vi } from 'vitest'

import { TransferStatus } from '../../src/models/ModelTransfer.js'
import {
  createModelTransfer,
  deleteModelTransfer,
  findModelTransferById,
  findModelTransfersByModelId,
  updateModelTransfer,
} from '../../src/services/modelTransfer.js'
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

const user = { dn: 'user:test' } as any

describe('services > modelTransfer', () => {
  const validObjectId = new Types.ObjectId().toHexString()

  test('findModelTransferById > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(undefined),
    }))

    const res = findModelTransferById(user, validObjectId)

    await expect(res).rejects.toThrowError(/^The requested model transfer was not found/)
  })

  test('findModelTransferById > returns valid transfer when found', async () => {
    const transfer = {
      _id: validObjectId,
      status: TransferStatus.InProgress,
    }

    ModelTransferModelMock.findOne.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(transfer),
    }))

    const result = await findModelTransferById(user, validObjectId)

    expect(result).toEqual(transfer)
  })

  test('findModelTransfersByModelId > throws NotFound when no transfers exist', async () => {
    ModelTransferModelMock.find.mockImplementation(() => ({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    }))

    const res = findModelTransfersByModelId(user, validObjectId)

    await expect(res).rejects.toThrowError(/^No model transfers found/)
  })

  test('findModelTransfersByModelId > returns transfers when found', async () => {
    const modelId = new Types.ObjectId().toHexString()
    const transfers = [
      {
        _id: new Types.ObjectId().toHexString(),
        modelId: new Types.ObjectId().toHexString(),
        peerId: 'peer-123',
        status: TransferStatus.Requested,
      },
      {
        _id: new Types.ObjectId().toHexString(),
        modelId: new Types.ObjectId().toHexString(),
        peerId: 'peer-123',
        status: TransferStatus.Completed,
      },
    ]

    ModelTransferModelMock.find.mockImplementation(() => ({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(transfers),
    }))

    const result = await findModelTransfersByModelId(user, modelId)

    expect(ModelTransferModelMock.find).toHaveBeenCalledWith({
      modelId: modelId,
    })
    expect(result).toEqual(transfers)
  })

  test('createModelTransfer > creates and returns transfer', async () => {
    const input = {
      modelId: 'model-123',
      peerId: 'peer-123',
      status: TransferStatus.Requested,
      createdBy: 'user:test',
    }

    const instance = {
      _id: 'mock-id',
      ...input,
      save: vi.fn().mockResolvedValue(undefined),
      toObject: vi.fn().mockReturnValue({
        _id: 'mock-id',
        ...input,
      }),
    }

    ModelTransferModelMock.mockImplementationOnce(function () {
      return instance as any
    })

    const result = await createModelTransfer(input)

    expect(ModelTransferModelMock).toHaveBeenCalledWith(input)
    expect(instance.save).toHaveBeenCalled()
    expect(result).toEqual({
      _id: 'mock-id',
      ...input,
    })
  })

  test('updateModelTransferStatus > throws BadReq for invalid ObjectId', async () => {
    const res = updateModelTransfer('001', TransferStatus.Completed)

    await expect(res).rejects.toThrowError(/^Invalid object id/)
  })

  test('updateModelTransferStatus > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(undefined),
    }))

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

    await expect(res).rejects.toThrowError(/^Invalid object id/)
  })

  test('deleteModelTransfer > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(null)

    const res = deleteModelTransfer(validObjectId)

    await expect(res).rejects.toThrowError(/^The requested model transfer was not found/)
  })

  test('deleteModelTransfer > soft deletes transfer', async () => {
    const transfer = {
      _id: validObjectId,
      id: validObjectId,
      delete: vi.fn().mockResolvedValue(undefined),
    }

    ModelTransferModelMock.findOne.mockResolvedValue(transfer as any)

    const result = await deleteModelTransfer(validObjectId)

    expect(transfer.delete).toHaveBeenCalled()
    expect(result).toEqual(validObjectId)
  })
})
