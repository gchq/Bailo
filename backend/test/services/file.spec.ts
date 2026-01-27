import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { FileAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { FileScanResult, ScanState } from '../../src/connectors/fileScanning/Base.js'
import {
  downloadFile,
  finishUploadMultipartFile,
  getFilesByIds,
  getFilesByModel,
  getTotalFileSize,
  removeFile,
  removeFiles,
  rerunFileScan,
  startUploadMultipartFile,
  updateFile,
  uploadFile,
} from '../../src/services/file.js'
import { isFileInterfaceDoc } from '../../src/utils/fileUtils.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')
vi.mock('../../src/connectors/fileScanning/index.js')

const FileModelMock = getTypedModelMock('FileModel')
const ScanModelMock = getTypedModelMock('ScanModel')

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

const idMock = vi.hoisted(() => ({
  longId: vi.fn(() => 'mock-long-id'),
}))
vi.mock('../../src/utils/id.js', () => idMock)

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
  getObjectStream: vi.fn(() => ({ pipe: vi.fn(), on: vi.fn() })),
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
const testFileIdReversed = testFileId.split('').reverse().join('')

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
  default: vi.fn(function () {
    return {
      init: vi.fn(function () {
        return {
          passthrough: vi.fn(function () {
            return clamscan
          }),
        }
      }),
    }
  }),
}))

describe('services > file', () => {
  test('uploadFile > success', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any
    const tags = []
    const result = await uploadFile(user, modelId, name, mime, stream, tags)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(FileModelMock.save).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('uploadFile > virus scan initialised', async () => {
    vi.spyOn(configMock, 'avScanning', 'get').mockReturnValue({ clamdscan: 'test' })
    vi.spyOn(configMock, 'connectors', 'get').mockReturnValue({
      fileScanners: {
        kinds: ['clamAV'],
      },
    })
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any
    const tags = []

    const result = await uploadFile(user, modelId, name, mime, stream, tags)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(FileModelMock.save).toBeCalled()
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
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any

    modelMocks.getModelById.mockResolvedValueOnce({ settings: { mirror: { sourceModelId: '123' } } })

    await expect(() => uploadFile(user, modelId, name, mime, stream)).rejects.toThrowError(
      /^Cannot upload files to a mirrored model./,
    )
    expect(FileModelMock.save).not.toBeCalled()
  })

  test('uploadFile > fileSize 0', async () => {
    vi.mocked(s3Mocks.putObjectStream).mockResolvedValue({
      fileSize: 0,
    })

    await expect(() =>
      uploadFile({} as any, 'modelId', 'mockFileName', 'mime', new Readable() as any),
    ).rejects.toThrowError(/^Could not upload mockFileName as it is an empty file./)
  })

  test('startUploadMultipartFile > success', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const size = configMock.s3.multipartChunkSize * 2
    const tags = []

    const result = await startUploadMultipartFile(user, modelId, name, mime, size, tags)

    expect(s3Mocks.startMultipartUpload).toBeCalled()
    expect(FileModelMock.save).toBeCalled()
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
    expect(FileModelMock.save).not.toBeCalled()
  })

  test('finishUploadMultipartFile > success', async () => {
    const user = { dn: 'testUser' } as any
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
    expect(FileModelMock.save).toBeCalled()
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
    FileModelMock.findById.mockResolvedValue(undefined)

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
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    const result = await removeFile(user, modelId, testFileId)

    expect(releaseServiceMocks.removeFileFromReleases).toBeCalled()
    expect(ScanModelMock.deleteMany).toBeCalledWith({ fileId: { $eq: testFileId } }, undefined)
    expect(FileModelMock.findOneAndDelete).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('removeFiles > success', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    vi.mocked(FileModelMock.aggregate)
      .mockResolvedValueOnce([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])
      .mockResolvedValueOnce([{ modelId: 'testModel2', _id: { toString: vi.fn(() => testFileIdReversed) } }])

    const result = await removeFiles(user, modelId, [testFileId, testFileIdReversed])

    expect(releaseServiceMocks.removeFileFromReleases).toBeCalled()
    expect(ScanModelMock.deleteMany).toBeCalledTimes(2)
    expect(ScanModelMock.deleteMany.mock.calls).toMatchSnapshot()
    expect(FileModelMock.findOneAndDelete).toBeCalledTimes(2)
    expect(result).toMatchSnapshot()
  })

  test('removeFiles > no release permission', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    releaseServiceMocks.removeFileFromReleases.mockRejectedValueOnce('Cannot update releases')

    const result = removeFiles(user, modelId, [testFileId])

    await expect(result).rejects.toThrowError(/^Cannot update releases/)
    expect(FileModelMock.delete).not.toBeCalled()
  })

  test('removeFiles > no file permission', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) {
        return { success: true, id: '' }
      }
      if (action === FileAction.Delete) {
        return { success: false, info: 'You do not have permission to delete a file from this model.', id: '' }
      }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    await expect(() => removeFiles(user, modelId, [testFileId])).rejects.toThrowError(
      /^You do not have permission to delete a file from this model./,
    )
    expect(FileModelMock.delete).not.toBeCalled()
  })

  test('removeFiles > success bypass mirrored model check', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    modelMocks.getModelById.mockResolvedValueOnce({
      settings: { mirror: { sourceModelId: 'sourceModelId' } },
    } as any)
    vi.mocked(FileModelMock.aggregate)
      .mockResolvedValueOnce([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])
      .mockResolvedValueOnce([{ modelId: 'testModel2', _id: { toString: vi.fn(() => testFileIdReversed) } }])

    const result = await removeFiles(user, modelId, [testFileId, testFileIdReversed], true)

    expect(releaseServiceMocks.removeFileFromReleases).toBeCalled()
    expect(ScanModelMock.deleteMany).toBeCalledTimes(2)
    expect(ScanModelMock.deleteMany.mock.calls).toMatchSnapshot()
    expect(FileModelMock.findOneAndDelete).toBeCalledTimes(2)
    expect(result).toMatchSnapshot()
  })

  test('removeFiles > throw on mirrored model', async () => {
    modelMocks.getModelById.mockResolvedValueOnce({
      settings: { mirror: { sourceModelId: 'sourceModelId' } },
    } as any)

    await expect(() => removeFiles({} as any, 'modelId', [testFileId])).rejects.toThrowError(
      /^Cannot remove file from a mirrored model./,
    )
    expect(FileModelMock.delete).not.toBeCalled()
  })

  test('getFilesByModel > success', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as any
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

    FileModelMock.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    const files = await getFilesByModel(user, modelId)
    expect(files).toStrictEqual([])
  })

  test('getFilesByIds > success', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      { example: 'file', avScan: [], _id: { toString: vi.fn(() => testFileId) } },
    ])

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const fileIds = [testFileId]

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toMatchSnapshot()
  })

  test('getFilesByIds > success with scans mapped', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
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

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const fileIds = ['123', '321']

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toMatchSnapshot()
  })

  test('getFilesByIds > no file ids', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const fileIds = []

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toStrictEqual(fileIds)
  })

  test('getFilesByIds > files not found', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => testFileId) } }])

    const user = { dn: 'testUser' } as any
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
    FileModelMock.aggregate.mockResolvedValueOnce([
      { example: 'file', avScan: [], _id: { toString: vi.fn(() => testFileId) } },
    ])

    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'
    const fileIds = [testFileId]

    const files = await getFilesByIds(user, modelId, fileIds)
    expect(files).toStrictEqual([])
  })

  test('downloadFile > success', async () => {
    const user = { dn: 'testUser' } as any
    const range = { start: 0, end: 50 }

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    const result = await downloadFile(user, testFileId, range)

    expect(result).toMatchSnapshot()
  })

  test('downloadFile > no permission', async () => {
    const user = { dn: 'testUser' } as any
    const range = { start: 0, end: 50 }
    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])

    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) {
        return { success: true, id: '' }
      }
      if (action === FileAction.Download) {
        return { success: false, info: 'You do not have permission to download this model.', id: '' }
      }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(downloadFile(user, testFileId, range)).rejects.toThrowError(
      /^You do not have permission to download this model./,
    )
  })

  test('getTotalFileSize > returns file size', async () => {
    FileModelMock.group.mockResolvedValueOnce([{ totalSize: 42 }])
    const size = await getTotalFileSize(['1', '2', '3'])

    expect(size).toBe(42)
  })

  test('rerunFileScan > successfully reruns a file scan', async () => {
    const createdAtTimeInMilliseconds = new Date().getTime() - 2000000
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([
      {
        state: ScanState.Complete,
        lastRunAt: new Date(createdAtTimeInMilliseconds),
      },
    ])
    const scanStatus = await rerunFileScan({} as any, 'model123', testFileId)
    expect(scanStatus).toBe('Scan started for file.txt')
  })

  test('rerunFileScan > throws bad request when attempting to upload an empty file', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 0,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([
      {
        state: ScanState.Complete,
      },
    ])
    await expect(rerunFileScan({} as any, 'model123', testFileId)).rejects.toThrowError(
      /^Cannot run scan on an empty file/,
    )
  })

  test('rerunFileScan > does not rerun file scan before delay is over', async () => {
    FileModelMock.aggregate.mockResolvedValueOnce([
      {
        name: 'file.txt',
        size: 123,
        _id: { toString: vi.fn(() => testFileId) },
      },
    ])
    ScanModelMock.find.mockResolvedValueOnce([{ state: ScanState.Complete, lastRunAt: new Date() }])
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
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValue([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])

    const result = await updateFile(user, modelId, testFileId, { tags: ['test1'] })

    expect(result).toMatchSnapshot()
    expect(FileModelMock.findOneAndUpdate).toHaveBeenCalledOnce()
  })

  test('updateFile > success multiple params', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValue([{ modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } }])

    const result = await updateFile(user, modelId, testFileId, {
      tags: ['test1'],
      name: 'my-file-renamed.txt',
      mime: 'text/plain',
    })

    expect(result).toMatchSnapshot()
    expect(FileModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: testFileId },
      {
        tags: ['test1'],
        name: 'my-file-renamed.txt',
        mime: 'text/plain',
      },
      { new: true },
    )
    expect(FileModelMock.findOneAndUpdate).toHaveBeenCalledOnce()
  })

  test('updateFile > file missing', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([])

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^Cannot find requested file/)
    expect(FileModelMock.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > model missing', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    modelMocks.getModelById.mockResolvedValueOnce(modelMocks.getModelById()).mockRejectedValueOnce('Error')

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^Cannot find requested model/)
    expect(FileModelMock.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > no permission', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    vi.mocked(authorisation.file).mockResolvedValueOnce({ success: true, id: '' }).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'] })

    await expect(promise).rejects.toThrowError(/^You do not have permission to upload a file to this model./)
    expect(FileModelMock.findOneAndUpdate).not.toBeCalled()
  })

  test('updateFile > problem updating file', async () => {
    const user = { dn: 'testUser' } as any
    const modelId = 'testModelId'

    FileModelMock.aggregate.mockResolvedValueOnce([
      { modelId: 'testModel', _id: { toString: vi.fn(() => testFileId) } },
    ])
    FileModelMock.findOneAndUpdate.mockResolvedValueOnce(null)

    const promise = updateFile(user, modelId, testFileId, { tags: ['test1'], name: 'this-will-break.txt' })

    await expect(promise).rejects.toThrowError(/^There was a problem updating the file/)
    expect(FileModelMock.findOneAndUpdate).toHaveBeenCalledOnce()
  })
})
