import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { FileAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { FileScanResult, ScanState } from '../../src/connectors/fileScanning/Base.js'
import { UserInterface } from '../../src/models/User.js'
import {
  downloadFile,
  finishUploadMultipartFile,
  getFilesByIds,
  getFilesByModel,
  getTotalFileSize,
  isFileInterfaceDoc,
  removeFile,
  rerunFileScan,
  startUploadMultipartFile,
  updateFile,
  uploadFile,
} from '../../src/services/file.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/fileScanning/index.js')

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const configMock = vi.hoisted(
  () =>
    ({
      avScanning: {
        clamdscan: {
          host: 'test',
          port: 8080,
        },
      },
      s3: {
        multipartChunkSize: 5 * 1024 * 1024,
        buckets: {
          uploads: 'uploads',
          registry: 'registry',
        },
      },
      connectors: {
        fileScanners: {
          kinds: ['clamAV'],
          retryDelayInMinutes: 5,
          maxInitRetries: 5,
          initRetryDelay: 5000,
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const fileScanResult: FileScanResult = {
  state: 'complete',
  isInfected: false,
  toolName: 'Test',
  lastRunAt: new Date(),
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [fileScanResult])),
}))
vi.mock('../../src/connectors/fileScanning/index.js', async () => ({ default: fileScanningMock }))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => ({ fileSize: 100 })),
  getObjectStream: vi.fn(() => ({ Body: { pipe: vi.fn() } })),
  completeMultipartUpload: vi.fn(),
  headObject: vi.fn(() => ({ ContentLength: 100 })),
  startMultipartUpload: vi.fn(() => ({ uploadId: 'uploadId' })),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirror: { sourceModelId: '' } } })),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseServiceMocks = vi.hoisted(() => ({
  removeFileFromReleases: vi.fn(),
}))
vi.mock('../../src/services/release.js', () => releaseServiceMocks)

const testFileId = '73859F8D26679D2E52597326'

const fileModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.group = vi.fn(() => obj)

  obj.save = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.findById = vi.fn(() => obj)
  obj.findOneAndDelete = vi.fn(() => obj)
  obj.findOneAndUpdate = vi.fn(() => obj)

  obj._id = 'mockFileId'
  obj.modelId = 'mockModelId'
  obj.name = 'mockFileName'
  obj.size = 100
  obj.mime = 'mock/mime'
  obj.path = '/mock/path'
  obj.complete = true
  obj.tags = []
  obj.createdAt = new Date('2024-01-01T00:00:00Z')
  obj.updatedAt = new Date('2024-01-02T00:00:00Z')

  // Rewrite toObject: return only the relevant plain object
  obj.toObject = vi.fn(() => ({
    _id: obj._id,
    modelId: obj.modelId,
    name: obj.name,
    size: obj.size,
    mime: obj.mime,
    path: obj.path,
    complete: obj.complete,
    tags: obj.tags,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  }))

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/File.js', () => ({ default: fileModelMocks }))

const scanModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)

  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)
  obj.deleteMany = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/Scan.js', () => ({ default: scanModelMocks }))

const baseScannerMock = vi.hoisted(() => ({
  ScanState: {
    NotScanned: 'notScanned',
    InProgress: 'inProgress',
    Complete: 'complete',
    Error: 'error',
  },
}))
vi.mock('../../src/connectors/filescanning/Base.js', () => baseScannerMock)

const clamscan = vi.hoisted(() => ({ on: vi.fn() }))
vi.mock('clamscan', () => ({
  __esModule: true,
  default: vi.fn(() => ({ init: vi.fn(() => ({ passthrough: vi.fn(() => clamscan) })) })),
}))

describe('services > file', () => {
  test('uploadFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any
    const tags = []
    const result = await uploadFile(user, modelId, name, mime, stream, tags)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('uploadFile > virus scan initialised', async () => {
    vi.spyOn(configMock, 'avScanning', 'get').mockReturnValue({ clamdscan: 'test' })
    vi.spyOn(configMock, 'connectors', 'get').mockReturnValue({
      fileScanners: {
        kinds: ['clamAV'],
      },
    })
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any
    const tags = []

    const result = await uploadFile(user, modelId, name, mime, stream, tags)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result).toMatchSnapshot()
    expect(clamscan.on.mock.calls).toMatchSnapshot()
  })

  test('uploadFile > no permission', async () => {
    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    await expect(() => uploadFile({} as any, 'modelId', 'name', 'mime', new Readable() as any)).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./,
    )
  })

  test('uploadFile > should throw an error when attempting to upload a file to a mirrored model', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any

    modelMocks.getModelById.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: '123' } } })

    await expect(() => uploadFile(user, modelId, name, mime, stream)).rejects.toThrowError(
      /^Cannot upload files to a mirrored model./,
    )
    expect(fileModelMocks.save).not.toBeCalled()
  })

  test('uploadFile > fileSize 0', async () => {
    vi.mocked(s3Mocks.putObjectStream).mockResolvedValue({
      fileSize: 0,
    })

    await expect(() => uploadFile({} as any, 'modelId', 'name', 'mime', new Readable() as any)).rejects.toThrowError(
      /^Could not upload mockFileName as it is an empty file./,
    )
  })

  test('startUploadMultipartFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const size = configMock.s3.multipartChunkSize * 2
    const tags = []

    const result = await startUploadMultipartFile(user, modelId, name, mime, size, tags)

    expect(s3Mocks.startMultipartUpload).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('startUploadMultipartFile > no permission', async () => {
    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    await expect(() => startUploadMultipartFile({} as any, 'modelId', 'name', 'mime', 1)).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./,
    )
  })

  test('startUploadMultipartFile > failed to get uploadId', async () => {
    vi.mocked(s3Mocks.startMultipartUpload).mockResolvedValue({} as any)

    await expect(() => startUploadMultipartFile({} as any, 'modelId', 'name', 'mime', 1)).rejects.toThrowError(
      /^Failed to get uploadId from startMultipartUpload./,
    )
  })

  test('startUploadMultipartFile > should throw an error when attempting to upload a file to a mirrored model', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: '123' } } })

    await expect(() => startUploadMultipartFile({} as any, 'modelId', 'name', 'mime', 1)).rejects.toThrowError(
      /^Cannot upload files to a mirrored model./,
    )
    expect(fileModelMocks.save).not.toBeCalled()
  })

  test('finishUploadMultipartFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileId = 'testFile'
    const uploadId = 'testUploadId'
    const parts = [
      { ETag: '0123456789abcdef', PartNumber: 1 },
      { ETag: 'fedcba9876543210', PartNumber: 2 },
    ]
    const tags = []

    const result = await finishUploadMultipartFile(user, modelId, fileId, uploadId, parts, tags)

    expect(s3Mocks.completeMultipartUpload).toBeCalled()
    expect(s3Mocks.headObject).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('finishUploadMultipartFile > no permission', async () => {
    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    await expect(() => finishUploadMultipartFile({} as any, 'modelId', 'fileId', 'uploadId', [])).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./,
    )
  })

  test('finishUploadMultipartFile > no file', async () => {
    vi.mocked(fileModelMocks.findById).mockResolvedValue()

    await expect(() => finishUploadMultipartFile({} as any, 'modelId', 'fileId', 'uploadId', [])).rejects.toThrowError(
      /^The requested file was not found./,
    )
  })

  test('finishUploadMultipartFile > no metadata ContentLength', async () => {
    vi.mocked(s3Mocks.headObject).mockResolvedValue({} as any)

    await expect(() => finishUploadMultipartFile({} as any, 'modelId', 'fileId', 'uploadId', [])).rejects.toThrowError(
      /^Could not determine uploaded file size./,
    )
  })

  test('removeFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    const result = await removeFile(user, modelId, testFileId)

    expect(releaseServiceMocks.removeFileFromReleases).toBeCalled()
    expect(scanModelMocks.deleteMany).toBeCalledWith({ fileId: { $eq: testFileId } }, undefined)
    expect(fileModelMocks.findOneAndDelete).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('removeFile > no release permission', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    releaseServiceMocks.removeFileFromReleases.mockRejectedValueOnce('Cannot update releases')

    const result = removeFile(user, modelId, testFileId)

    await expect(result).rejects.toThrowError(/^Cannot update releases/)
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('removeFile > no file permission', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) return { success: true, id: '' }
      if (action === FileAction.Delete)
        return { success: false, info: 'You do not have permission to delete a file from this model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    await expect(() => removeFile(user, modelId, testFileId)).rejects.toThrowError(
      /^You do not have permission to delete a file from this model./,
    )
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('removeFile > should throw an error when attempting to remove a file from a mirrored model', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'Cannot remove file from a mirrored model.',
      success: false,
      id: '',
    })
    await expect(() => removeFile(user, modelId, testFileId)).rejects.toThrowError(
      /^Cannot remove file from a mirrored model./,
    )
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('getFilesByModel > success', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    const result = await getFilesByModel(user, modelId)

    expect(result).toMatchSnapshot()
  })

  test('getFilesByModel > no permission', async () => {
    vi.mocked(authorisation.files).mockResolvedValue([
      {
        info: 'You do not have permission to get the files from this model.',
        success: false,
        id: '',
      },
    ])

    fileModelMocks.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    const files = await getFilesByModel(user, modelId)
    expect(files).toStrictEqual([])
  })

  test('getFilesByIds > success', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([
      { example: 'file', avScan: [], _id: { toString: vi.fn(() => testFileId) } },
    ])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = [testFileId]

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toMatchSnapshot()
  })

  test('getFilesByIds > success with scans mapped', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([
      {
        example: 'file',
        _id: '123',
        avScan: [{ fileId: '123' }, { fileId: '123' }],
      },
      {
        example: 'file',
        _id: '321',
        avScan: [{ fileId: '321' }],
      },
    ])
    vi.mocked(authorisation.files).mockResolvedValue([
      { success: true, id: '123' },
      { success: true, id: '321' },
    ])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = ['123', '321']

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toMatchSnapshot()
  })

  test('getFilesByIds > no file ids', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = []

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toStrictEqual(fileIds)
  })

  test('getFilesByIds > files not found', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = [testFileId, testFileId]

    const files = getFilesByIds(user, modelId, fileIds)

    await expect(files).rejects.toThrowError(/^The requested files were not found./)
  })

  test('getFilesByIds > no permission', async () => {
    vi.mocked(authorisation.files).mockResolvedValue([
      {
        info: 'You do not have permission to get the files from this model.',
        success: false,
        id: '',
      },
    ])
    fileModelMocks.aggregate.mockResolvedValueOnce([
      { example: 'file', avScan: [], _id: { toString: vi.fn(() => testFileId) } },
    ])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = [testFileId]

    const files = await getFilesByIds(user, modelId, fileIds)
    expect(files).toStrictEqual([])
  })

  test('downloadFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const range = { start: 0, end: 50 }

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    const result = await downloadFile(user, testFileId, range)

    expect(result).toMatchSnapshot()
  })

  test('downloadFile > no permission', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const range = { start: 0, end: 50 }
    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) return { success: true, id: '' }
      if (action === FileAction.Download)
        return { success: false, info: 'You do not have permission to download this model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(downloadFile(user, testFileId, range)).rejects.toThrowError(
      /^You do not have permission to download this model./,
    )
  })

  test('getTotalFileSize > returns file size', async () => {
    fileModelMocks.group.mockResolvedValueOnce([{ totalSize: 42 }])
    const size = await getTotalFileSize(['1', '2', '3'])

    expect(size).toBe(42)
  })

  test('rerunFileScan > successfully reruns a file scan', async () => {
    const createdAtTimeInMilliseconds = new Date().getTime() - 2000000
    fileModelMocks.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    scanModelMocks.find.mockResolvedValueOnce([
      {
        state: ScanState.Complete,
        lastRunAt: new Date(createdAtTimeInMilliseconds),
      },
    ])
    const scanStatus = await rerunFileScan({} as any, 'model123', testFileId)
    expect(scanStatus).toBe('Scan started for file.txt')
  })

  test('rerunFileScan > throws bad request when attempting to upload an empty file', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 0,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    scanModelMocks.find.mockResolvedValueOnce([
      {
        state: ScanState.Complete,
      },
    ])
    await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
      /^Cannot run scan on an empty file/,
    )
  })

  test('rerunFileScan > does not rerun file scan before delay is over', async () => {
    fileModelMocks.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    scanModelMocks.find.mockResolvedValueOnce([{ state: ScanState.Complete, lastRunAt: new Date() }])
    await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
      /^Please wait 5 minutes before attempting a rescan file.txt/,
    )
  })

  test('isFileInterfaceDoc > success', async () => {
    const result = isFileInterfaceDoc({
      modelId: '',
      name: '',
      size: 1,
      mime: '',
      bucket: '',
      path: '',
      complete: true,
      deleted: false,
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(true)
  })

  test('isFileInterfaceDoc > missing property', async () => {
    const result = isFileInterfaceDoc({
      modelId: '',
      name: '',
      mime: '',
      path: '',
      complete: true,
      deleted: false,
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(false)
  })

  test('isFileInterfaceDoc > wrong type', async () => {
    const result = isFileInterfaceDoc(null)

    expect(result).toBe(false)
  })

  test('updateFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValue([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])

    const result = await updateFile(user, modelId, testFileId, { tags: ['test1'] })

    expect(result).toMatchSnapshot()
    expect(fileModelMocks.findOneAndUpdate).toHaveBeenCalledOnce()
  })

  test('updateFile > success multiple params', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValue([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])

    const result = await updateFile(user, modelId, testFileId, {
      tags: ['test1'],
      name: 'my-file-renamed.txt',
      mime: 'text/plain',
    })

    expect(result).toMatchSnapshot()
    expect(fileModelMocks.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: testFileId },
      {
        tags: ['test1'],
        name: 'my-file-renamed.txt',
        mime: 'text/plain',
      },
      { new: true },
    )
    expect(fileModelMocks.findOneAndUpdate).toHaveBeenCalledOnce()
  })

  test('updateFile > file missing', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([])

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^Cannot find requested file/)
    expect(fileModelMocks.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > model missing', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    modelMocks.getModelById.mockResolvedValueOnce(modelMocks.getModelById()).mockRejectedValueOnce('Error')

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^Cannot find requested model/)
    expect(fileModelMocks.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > no permission', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    vi.mocked(authorisation.file).mockResolvedValueOnce({ success: true, id: '' }).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^You do not have permission to upload a file to this model./)
    expect(fileModelMocks.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > problem updating file', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    fileModelMocks.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    fileModelMocks.findOneAndUpdate.mockResolvedValueOnce(null)

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'], name: 'this-will-break.txt' })

    await expect(promise).rejects.toThrowError(/^There was a problem updating the file/)
    expect(fileModelMocks.findOneAndUpdate).toHaveBeenCalledOnce()
  })
})
