import { describe, expect, test, vi } from 'vitest'

import { TransferStatus } from '../../src/models/ModelTransfer.js'
import {
  createModelTransfer,
  deleteModelTransfer,
  filterArtefactsByKindAndStatus,
  findModelTransferById,
  findModelTransfersByModelId,
  handleCompleteEmail,
  updateModelTransfer,
} from '../../src/services/modelTransfer.js'
import { MirrorKind } from '../../src/types/types.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

const ModelTransferModelMock = getTypedModelMock('ModelTransferModel')

const modelMock = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/model.js', () => modelMock)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', () => ({
  default: logMock,
}))

const smtpMock = vi.hoisted(() => ({
  transferCompleteNotification: vi.fn(),
}))
vi.mock('../../src/services/smtp/smtp.js', () => smtpMock)

const webhookMock = vi.hoisted(() => ({
  dispatchWebhooks: vi.fn(),
}))
vi.mock('../../src/services/webhook.ts', () => webhookMock)

const user = { dn: 'user:test' } as any

describe('services > modelTransfer', () => {
  const validExportId = 'abc123'
  const validArtefactsStatus = {
    exportId: validExportId,
    modelId: 'model-123',
    completed: true,
    completedNotificationSent: false,
    status: TransferStatus.Completed,
    artefactStatus: [
      { key: 'file1', kind: MirrorKind.File, status: TransferStatus.Completed },
      { key: 'file2', kind: MirrorKind.File, status: TransferStatus.Failed },
      { key: 'image1', kind: MirrorKind.Image, status: TransferStatus.Completed },
    ],
  }

  test('findModelTransferById > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(undefined),
    }))

    const res = findModelTransferById(user, validExportId)

    await expect(res).rejects.toThrow(/^The requested model transfer was not found/)
  })

  test('findModelTransferById > returns valid transfer when found', async () => {
    const transfer = {
      exportId: validExportId,
      status: TransferStatus.InProgress,
    }

    ModelTransferModelMock.findOne.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(transfer),
    }))

    const result = await findModelTransferById(user, validExportId)

    expect(result).toEqual(transfer)
  })

  test('findModelTransfersByModelId > throws NotFound when no transfers exist', async () => {
    ModelTransferModelMock.find.mockImplementation(() => ({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    }))

    const res = findModelTransfersByModelId(user, validExportId)

    await expect(res).rejects.toThrow(/^No model transfers found/)
  })

  test('findModelTransfersByModelId > returns transfers when found', async () => {
    const modelId = 'model-abc123'
    const transfers = [
      {
        exportId: validExportId,
        modelId: 'model-abc123',
        peerId: 'peer-123',
        status: TransferStatus.Requested,
      },
      {
        exportId: validExportId,
        modelId: 'model-abc123',
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
      exportId: 'abc-123',
      createdBy: 'user:test',
    }

    const instance = {
      ...input,
      save: vi.fn().mockResolvedValue(undefined),
      toObject: vi.fn().mockReturnValue({
        ...input,
      }),
    }

    ModelTransferModelMock.mockImplementationOnce(function () {
      return instance as any
    })

    const result = await createModelTransfer(input)

    expect(ModelTransferModelMock).toHaveBeenCalledWith(input)
    expect(instance.save).toHaveBeenCalled()
    expect(result).toEqual(input)
  })

  test('updateModelTransferStatus > throws BadReq for invalid ObjectId', async () => {
    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => {
      return {
        lean: vi.fn().mockResolvedValue(undefined),
      }
    })

    const res = updateModelTransfer('001', {})

    await expect(res).rejects.toThrow(/^The requested model transfer was not found/)
  })

  test('updateModelTransferStatus > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(undefined),
    }))

    const res = updateModelTransfer(validExportId, {})

    await expect(res).rejects.toThrow(/^The requested model transfer was not found/)
  })

  test('updateModelTransferStatus > updates and returns transfer', async () => {
    const updated = {
      exportId: validExportId,
      status: TransferStatus.Completed,
    }

    ModelTransferModelMock.findOneAndUpdate.mockImplementation(() => {
      return {
        lean: vi.fn().mockResolvedValue(updated),
      }
    })

    const result = await updateModelTransfer(validExportId, {})

    expect(ModelTransferModelMock.findOneAndUpdate).toHaveBeenCalled()

    expect(result).toEqual(updated)
  })

  test('deleteModelTransfer > throws BadReq for invalid exportId', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(null)

    const res = deleteModelTransfer('001')

    await expect(res).rejects.toThrow(/^The requested model transfer was not found./)
  })

  test('deleteModelTransfer > throws NotFound when transfer does not exist', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(null)

    const res = deleteModelTransfer(validExportId)

    await expect(res).rejects.toThrow(/^The requested model transfer was not found/)
  })

  test('deleteModelTransfer > soft deletes transfer', async () => {
    const transfer = {
      exportId: validExportId,
      delete: vi.fn().mockResolvedValue(undefined),
    }

    ModelTransferModelMock.findOne.mockResolvedValue(transfer as any)

    const result = await deleteModelTransfer(validExportId)

    expect(transfer.delete).toHaveBeenCalled()
    expect(result).toEqual(validExportId)
  })

  test('handleCompleteEmail  > no transfer', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(null)
    vi.doUnmock('../../src/services/log.js')

    await handleCompleteEmail(validExportId)

    expect(logMock.warn).toHaveBeenCalledWith({ exportId: validExportId }, 'The requested model transfer was not found')

    vi.doMock('../../src/services/log.js', () => ({ default: logMock }))
  })

  test('handleCompleteEmail > transfer not complete', async () => {
    const spy = vi.spyOn({ filterArtefactsByKindAndStatus }, 'filterArtefactsByKindAndStatus')
    ModelTransferModelMock.findOne.mockResolvedValue({
      completed: false,
    })

    await handleCompleteEmail(validExportId)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('handleCompleteEmail > transfer not updated', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(validArtefactsStatus)
    ModelTransferModelMock.findOneAndUpdate.mockResolvedValue(null)

    await handleCompleteEmail(validExportId)
    expect(smtpMock.transferCompleteNotification).not.toHaveBeenCalled()
    expect(webhookMock.dispatchWebhooks).not.toHaveBeenCalled()
  })

  test('handleCompleteEmail > success, updated is truthy', async () => {
    ModelTransferModelMock.findOne.mockResolvedValue(validArtefactsStatus)
    ModelTransferModelMock.findOneAndUpdate.mockResolvedValue({
      exportId: validExportId,
    })

    await handleCompleteEmail(validExportId)
    expect(smtpMock.transferCompleteNotification).toHaveBeenCalled()
    expect(webhookMock.dispatchWebhooks).toHaveBeenCalled()
  })
})
