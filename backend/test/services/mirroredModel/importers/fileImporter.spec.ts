import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FileImporter } from '../../../../src/services/mirroredModel/importers/fileImporter.js'
import { FileExportMetadata, ImportKind } from '../../../../src/services/mirroredModel/mirroredModel.js'

vi.mock('../../../../src/services/model.js', () => ({}))
vi.mock('../../../../src/services/release.js', () => ({}))
vi.mock('../../../../src/connectors/fileScanning/index.js', () => ({}))

const authMocks = vi.hoisted(() => ({
  default: {
    releases: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const configMocks = vi.hoisted(() => ({
  s3: {
    buckets: {
      uploads: 'uploads-bucket',
    },
  },
  modelMirror: {
    contentDirectory: 'content-dir',
  },
}))
vi.mock('../../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMocks,
}))

const logMocks = vi.hoisted(() => ({
  debug: vi.fn(),
}))
vi.mock('../../../../src/services/log.js', () => ({
  default: logMocks,
}))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(),
}))
vi.mock('../../../../src/clients/s3.js', () => s3Mocks)

const fileModelMocks = vi.hoisted(() => ({
  findOne: vi.fn(),
}))
vi.mock('../../../../src/models/File.js', () => ({
  __esModule: true,
  default: fileModelMocks,
}))

const fileServiceMocks = vi.hoisted(() => ({
  createFilePath: vi.fn(() => 'updated/file/path'),
  markFileAsCompleteAfterImport: vi.fn(),
}))
vi.mock('../../../../src/services/file.js', () => fileServiceMocks)

const registryMocks = vi.hoisted(() => ({
  joinDistributionPackageName: vi.fn(() => 'repo/path:tag'),
}))
vi.mock('../../../../src/services/registry.js', () => registryMocks)

const mockMetadata: FileExportMetadata = {
  importKind: ImportKind.File,
  mirroredModelId: 'model123',
  filePath: 'original/file/path',
} as FileExportMetadata

describe('services > mirroredModel > importers > FileImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('constructor > success', () => {
    const importer = new FileImporter(mockMetadata)

    expect(importer.bucket).toBe(configMocks.s3.buckets.uploads)
    expect(importer.updatedPath).toBe('updated/file/path')
    expect(importer.extractedFile).toBe(false)
  })

  test('constructor > error importKind not File', () => {
    const badMetadata = { ...mockMetadata, importKind: 'OtherKind' } as any

    expect(() => new FileImporter(badMetadata)).toThrowError(
      /^Cannot parse compressed File: incorrect metadata specified./,
    )
  })

  test('processEntry > success upload new file to S3', async () => {
    fileModelMocks.findOne.mockResolvedValue(null)

    const importer = new FileImporter(mockMetadata)
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')

    await importer.processEntry(entry, stream)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledWith('updated/file/path', stream, 'uploads-bucket')
    expect(fileServiceMocks.markFileAsCompleteAfterImport).toHaveBeenCalledWith('updated/file/path')
    expect(importer.extractedFile).toBe(true)
  })

  test('processEntry > success skip already existing file', async () => {
    fileModelMocks.findOne.mockResolvedValue({ id: 'existingId' })

    const importer = new FileImporter(mockMetadata)
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')
    // spy on resume
    const resumeSpy = vi.spyOn(stream, 'resume')

    await importer.processEntry(entry, stream)

    expect(resumeSpy).toHaveBeenCalled()
    expect(s3Mocks.putObjectStream).not.toHaveBeenCalled()
    expect(importer.extractedFile).toBe(true)
  })

  test('processEntry > error on multiple files', async () => {
    fileModelMocks.findOne.mockResolvedValue(null)

    const importer = new FileImporter(mockMetadata)
    importer.extractedFile = true
    const entry: Headers = { name: 'file1', type: 'file' } as Headers
    const stream = new PassThrough()
    stream.end('file-contents')

    await expect(importer.processEntry(entry, stream)).rejects.toThrowError(
      /^Cannot parse compressed file: multiple files found./,
    )
  })

  test('processEntry > success skip non-file entries', async () => {
    const importer = new FileImporter(mockMetadata)
    const entry: Headers = { name: 'dir', type: 'directory' } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(logMocks.debug).toHaveBeenCalledWith({ name: 'dir', type: 'directory' }, 'Skipping non-file entry.')
  })

  test('finishListener > success calls BaseImporter behaviour', () => {
    const importer = new FileImporter(mockMetadata)
    const resolve = vi.fn()
    const reject = vi.fn()

    importer.finishListener(resolve, reject)

    expect(resolve).toHaveBeenCalledWith({ metadata: mockMetadata })
  })
})
