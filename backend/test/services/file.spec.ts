import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { FileAction } from '../../src/connectors/authorisation/actions.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { FileScanResult, ScanState } from '../../src/connectors/fileScanning/Base.js'
import { UserInterface } from '../../src/models/User.js'
import {
  downloadFile,
  getFilesByIds,
  getFilesByModel,
  getTotalFileSize,
  isFileInterfaceDoc,
  removeFile,
  rerunFileScan,
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

const fileModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.group = vi.fn(() => obj)

  obj.save = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/File.js', () => ({ default: fileModelMocks }))

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
    fileModelMocks.save.mockResolvedValueOnce({ example: true })
    const result = await uploadFile(user, modelId, name, mime, stream)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result.save).toBe(fileModelMocks.save)
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
    fileModelMocks.save.mockResolvedValueOnce({ example: true })

    const result = await uploadFile(user, modelId, name, mime, stream)

    expect(s3Mocks.putObjectStream).toBeCalled()
    expect(fileModelMocks.save).toBeCalled()
    expect(result.save).toBe(fileModelMocks.save)
    expect(clamscan.on.mock.calls).toMatchSnapshot()
  })

  test('uploadFile > no permission', async () => {
    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'You do not have permission to upload a file to this model.',
      success: false,
      id: '',
    })

    expect(() => uploadFile({} as any, 'modelId', 'name', 'mime', new Readable() as any)).rejects.toThrowError(
      /^You do not have permission to upload a file to this model./,
    )
  })

  test('uploadFile > should throw an error when attempting to upload a file to a mirrored model', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const name = 'testFile'
    const mime = 'text/plain'
    const stream = new Readable() as any

    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'Cannot upload files to a mirrored model.',
      success: false,
      id: '',
    })

    expect(() => uploadFile(user, modelId, name, mime, stream)).rejects.toThrowError(
      /^Cannot upload files to a mirrored model./,
    )
    expect(fileModelMocks.save).not.toBeCalled()
  })
  test('removeFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    const result = await removeFile(user, modelId, fileId)

    expect(releaseServiceMocks.removeFileFromReleases).toBeCalled()
    expect(result).toMatchSnapshot()
  })

  test('removeFile > no release permission', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    releaseServiceMocks.removeFileFromReleases.mockRejectedValueOnce('Cannot update releases')

    const result = removeFile(user, modelId, fileId)

    expect(result).rejects.toThrowError(/^Cannot update releases/)
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('removeFile > no file permission', async () => {
    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) return { success: true, id: '' }
      if (action === FileAction.Delete)
        return { success: false, info: 'You do not have permission to delete a file from this model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    expect(() => removeFile(user, modelId, fileId)).rejects.toThrowError(
      /^You do not have permission to delete a file from this model./,
    )
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('removeFile > should throw an error when attempting to remove a file from a mirrored model', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileId = 'testFileId'

    vi.mocked(authorisation.file).mockResolvedValue({
      info: 'Cannot remove file from a mirrored model.',
      success: false,
      id: '',
    })
    expect(() => removeFile(user, modelId, fileId)).rejects.toThrowError(/^Cannot remove file from a mirrored model./)
    expect(fileModelMocks.delete).not.toBeCalled()
  })

  test('getFilesByModel > success', async () => {
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

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

    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'

    const files = await getFilesByModel(user, modelId)
    expect(files).toStrictEqual([])
  })

  test('getFilesByIds > success', async () => {
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = ['testFileId']

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toMatchSnapshot()
  })

  test('getFilesByIds > no file ids', async () => {
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = []

    const files = await getFilesByIds(user, modelId, fileIds)

    expect(files).toStrictEqual(fileIds)
  })

  test('getFilesByIds > files not found', async () => {
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file', _id: { toString: vi.fn(() => 'testFileId') } }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = ['testFileId', 'testFileId2']

    const files = getFilesByIds(user, modelId, fileIds)

    expect(files).rejects.toThrowError(/^The requested files were not found./)
  })

  test('getFilesByIds > no permission', async () => {
    vi.mocked(authorisation.files).mockResolvedValue([
      {
        info: 'You do not have permission to get the files from this model.',
        success: false,
        id: '',
      },
    ])
    fileModelMocks.find.mockResolvedValueOnce([{ example: 'file' }])

    const user = { dn: 'testUser' } as UserInterface
    const modelId = 'testModelId'
    const fileIds = ['testFileId']

    const files = await getFilesByIds(user, modelId, fileIds)
    expect(files).toStrictEqual([])
  })

  test('downloadFile > success', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const fileId = 'testFileId'
    const range = { start: 0, end: 50 }

    const result = await downloadFile(user, fileId, range)

    expect(result).toMatchSnapshot()
  })

  test('downloadFile > no permission', async () => {
    const user = { dn: 'testUser' } as UserInterface
    const fileId = 'testFileId'
    const range = { start: 0, end: 50 }

    vi.mocked(authorisation.file).mockImplementation(async (_user, _model, _file, action) => {
      if (action === FileAction.View) return { success: true, id: '' }
      if (action === FileAction.Download)
        return { success: false, info: 'You do not have permission to download this model.', id: '' }

      return { success: false, info: 'Unknown action.', id: '' }
    })

    await expect(downloadFile(user, fileId, range)).rejects.toThrowError(
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
    fileModelMocks.findOne.mockResolvedValueOnce({
      name: 'file.txt',
      avScan: [{ state: ScanState.Complete, lastRunAt: new Date(createdAtTimeInMilliseconds) }],
      size: 123,
    })
    const scanStatus = await rerunFileScan({} as any, 'model123', 'file123')
    expect(scanStatus).toBe('Scan started for file.txt')
  })

  test('rerunFileScan > throws bad request when attemtping to upload an empty file', async () => {
    fileModelMocks.findOne.mockResolvedValueOnce({
      name: 'file.txt',
      avScan: [{ state: ScanState.Complete }],
      size: 0,
    })
    await expect(rerunFileScan({} as any, 'model123', 'file123')).rejects.toThrowError(
      /^Cannot run scan on an empty file/,
    )
  })

  test('rerunFileScan > does not rerun file scan before delay is over', async () => {
    fileModelMocks.findOne.mockResolvedValueOnce({
      name: 'file.txt',
      avScan: [{ state: ScanState.Complete, lastRunAt: new Date() }],
      size: 123,
    })
    await expect(rerunFileScan({} as any, 'model123', 'file123')).rejects.toThrowError(
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
      avScan: [],
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
      size: 1,
      mime: '',
      path: '',
      complete: true,
      avScan: [],
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
})
