import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FileImporter, FileMirrorMetadata } from '../../../../src/services/mirroredModel/importers/file.js'
import config from '../../../../src/utils/__mocks__/config.js'
import { getTypedModelMock } from '../../../testUtils/setupMongooseModelMocks.js'

const FileModelMock = getTypedModelMock('FileModel')

const authMocks = vi.hoisted(() => ({
  default: {
    releases: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const logMocks = vi.hoisted(() => ({
  trace: vi.fn(),
  debug: vi.fn(),
}))
vi.mock('../../../../src/services/log.js', () => ({
  default: logMocks,
}))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(),
}))
vi.mock('../../../../src/clients/s3.js', () => s3Mocks)

const fileServiceMocks = vi.hoisted(() => ({
  createFilePath: vi.fn(() => 'updated/file/path'),
  markFileAsCompleteAfterImport: vi.fn(),
}))
vi.mock('../../../../src/services/file.js', () => fileServiceMocks)

const registryMocks = vi.hoisted(() => ({
  joinDistributionPackageName: vi.fn(() => 'repo/path:tag'),
}))
vi.mock('../../../../src/services/registry.js', () => registryMocks)

const mirroredModelMocks = vi.hoisted(() => ({
  MirrorKind: { File: 'file' },
}))
vi.mock('../../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

const mockMetadata: FileMirrorMetadata = {
  importKind: mirroredModelMocks.MirrorKind.File,
  mirroredModelId: 'model123',
  filePath: 'original/file/path',
} as FileMirrorMetadata
const mockLogData = { extra: 'info', importId: 'importId' }

describe('connectors > mirroredModel > importers > FileImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('constructor > success', () => {
    const importer = new FileImporter(mockMetadata, mockLogData)

    expect(importer).toMatchSnapshot()
  })

  test('constructor > error importKind not File', () => {
    const badMetadata = { ...mockMetadata, importKind: 'OtherKind' } as any

    expect(() => new FileImporter(badMetadata, mockLogData)).toThrowError(
      /^Cannot parse compressed File: incorrect metadata specified./,
    )
  })

  test('processEntry > success upload new file to S3', async () => {
    FileModelMock.findOne.mockResolvedValue(null)

    const importer = new FileImporter(mockMetadata, mockLogData)
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')

    await importer.processEntry(entry, stream)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledWith('updated/file/path', stream, config?.s3?.buckets?.uploads)
    expect(fileServiceMocks.markFileAsCompleteAfterImport).toHaveBeenCalledWith('updated/file/path')
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > success skip already existing file', async () => {
    FileModelMock.findOne.mockResolvedValue({ id: 'existingId' })
    const importer = new FileImporter(mockMetadata, mockLogData)
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')
    const resumeSpy = vi.spyOn(stream, 'resume')

    await importer.processEntry(entry, stream)

    expect(resumeSpy).toHaveBeenCalled()
    expect(s3Mocks.putObjectStream).not.toHaveBeenCalled()
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > error on multiple files', async () => {
    FileModelMock.findOne.mockResolvedValue(null)
    const importer = new FileImporter(mockMetadata, mockLogData)
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')
    const stream2 = new PassThrough()
    stream2.end('file-contents')

    await importer.processEntry(entry, stream)

    await expect(importer.processEntry(entry, stream2)).rejects.toThrowError(
      /^Cannot parse compressed file: multiple files found./,
    )
  })

  test('processEntry > success skip non-file entries', async () => {
    const importer = new FileImporter(mockMetadata, mockLogData)
    const entry: Headers = { name: 'dir', type: 'directory' } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(logMocks.debug).toHaveBeenCalledWith(
      { name: 'dir', type: 'directory', importerType: 'FileImporter', ...mockLogData },
      'Skipping non-file entry.',
    )
  })

  test('finishListener > success calls BaseImporter behaviour', () => {
    const importer = new FileImporter(mockMetadata, mockLogData)
    const resolve = vi.fn()
    const reject = vi.fn()

    importer.finishListener(resolve, reject)

    expect(resolve).toHaveBeenCalledWith({
      metadata: mockMetadata,
      sourcePath: mockMetadata.filePath,
      newPath: 'updated/file/path',
    })
  })
})
