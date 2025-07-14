import { Readable } from 'stream'
import { EventEmitter, PassThrough } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { Response } from '../../src/connectors/authorisation/base.js'
import authorisation from '../../src/connectors/authorisation/index.js'
import { FileScanResult } from '../../src/connectors/fileScanning/Base.js'
import { ArtefactKind } from '../../src/models/Scan.js'
import { UserInterface } from '../../src/models/User.js'
import {
  exportCompressedRegistryImage,
  exportModel,
  importCompressedRegistryImage,
  ImportKind,
  ImportKindKeys,
  importModel,
  pipeStreamToTarEntry,
} from '../../src/services/mirroredModel.js'

const fileScanResult: FileScanResult = {
  state: 'complete',
  isInfected: false,
  lastRunAt: new Date(),
  toolName: 'Test',
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [fileScanResult])),
}))
vi.mock('../../src/connectors/fileScanning/index.js', async () => ({ default: fileScanningMock }))

const mockUnzipperEntries: any[] = []
class MockUnzipperEntry {
  path: string
  type: string = 'File'
  fileContents: string

  constructor(path: string, fileContents: string) {
    this.path = path
    this.fileContents = fileContents
  }

  async *[Symbol.asyncIterator]() {
    yield Buffer.from(this.fileContents, 'utf-8')
  }
  autodrain() {}
}
const unzipperMock = vi.hoisted(() => ({
  Parse: vi.fn(() => {
    return {
      async *[Symbol.asyncIterator]() {
        for (const mockEntryData of mockUnzipperEntries) {
          yield new MockUnzipperEntry(mockEntryData.path, mockEntryData.fileContents)
        }
      },
      pipe() {
        return this
      },
    }
  }),
}))
vi.mock('unzipper', async () => unzipperMock)

const baseScannerMock = vi.hoisted(() => ({
  ScanState: {
    NotScanned: 'notScanned',
    InProgress: 'inProgress',
    Complete: 'complete',
    Error: 'error',
  },
}))
vi.mock('../../src/connectors/filescanning/Base.js', () => baseScannerMock)

const bufferMock = vi.hoisted(() => ({
  unzipSync: vi.fn(),
}))
vi.mock('node:buffer', async () => bufferMock)

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true, body: new MockReadable(), text: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

const authMock = vi.hoisted(() => ({
  model: vi.fn<() => Response>(() => ({ id: 'test', success: true })),
  releases: vi.fn<() => Response[]>(() => []),
}))
vi.mock('../../src/connectors/authorisation/index.js', async () => ({
  default: authMock,
}))

const configMock = vi.hoisted(
  () =>
    ({
      ui: {
        modelMirror: {
          import: {
            enabled: true,
          },
          export: {
            enabled: true,
          },
        },
      },
      s3: { buckets: { uploads: 'test' } },
      modelMirror: {
        export: {
          maxSize: 100,
          kmsSignature: {
            enabled: true,
          },
        },
      },
      registry: {
        connection: {
          internal: 'https://localhost:5000',
        },
      },
      connectors: {
        audit: {
          kind: 'silly',
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirror: { destinationModelId: '123' } }, card: { schemaId: 'test' } })),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(), version: 123 }]),
  setLatestImportedModelCard: vi.fn(),
  saveImportedModelCard: vi.fn(),
  isModelCardRevisionDoc: vi.fn(() => true),
  validateMirroredModel: vi.fn(() => ({
    settings: { mirror: { destinationModelId: 'abc' } },
    card: { schemaId: 'test' },
  })),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  getReleasesForExport: vi.fn(() => [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    { toJSON: vi.fn(), images: [] as { repository: string; name: string; tag: string; toObject: Function }[] },
  ]),
  getAllFileIds: vi.fn(() => [{}]),
  isReleaseDoc: vi.fn(() => true),
  saveImportedRelease: vi.fn(() => ({ modelId: 'source-model-id' })),
}))
vi.mock('../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  getFilesByIds: vi.fn(() => [
    {
      _id: '123',
      avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '123', state: 'complete', isInfected: false }],
      toJSON: vi.fn(),
    },
  ]),
  getTotalFileSize: vi.fn(() => 42),
  downloadFile: vi.fn(() => ({ Body: 'test' })),
  markFileAsCompleteAfterImport: vi.fn(),
  isFileInterfaceDoc: vi.fn(() => true),
  createFilePath: vi.fn(() => 'file/path'),
  saveImportedFile: vi.fn(),
}))
vi.mock('../../src/services/file.js', () => fileMocks)

const archiverMocks = vi.hoisted(() => ({
  append: vi.fn(),
  finalize: vi.fn(),
  pipe: vi.fn(),
}))
vi.mock('archiver', () => ({ default: vi.fn(() => archiverMocks) }))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => Promise.resolve({ fileSize: 100 })),
  getObjectStream: vi.fn(() => Promise.resolve({ Body: new MockReadable() })),
  objectExists: vi.fn(() => Promise.resolve(true)),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const kmsMocks = vi.hoisted(() => ({
  sign: vi.fn(),
}))
vi.mock('../../src/clients/kms.js', () => kmsMocks)

const hashMocks = vi.hoisted(() => ({
  createHash: vi.fn(() => ({
    setEncoding: vi.fn(),
    end: vi.fn(),
    read: vi.fn(() => 'test digest'),
  })),
}))
vi.mock('node:crypto', () => hashMocks)

const zlibMocks = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createGunzip: vi.fn((options) => {
    return new MockReadable()
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createGzip: vi.fn((options) => {
    return new MockReadable()
  }),
  constants: { Z_BEST_SPEED: 1 },
}))
vi.mock('node:zlib', () => ({ default: zlibMocks }))

const mockTarStream = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entry: vi.fn(({ name, size }) => {
    return new MockWritable()
  }),
  pipe: vi.fn().mockReturnThis(),
  finalize: vi.fn(),
}
const tarMocks = vi.hoisted(() => ({
  extract: vi.fn(() => new MockReadable()),
  pack: vi.fn(() => mockTarStream),
  constants: { Z_BEST_SPEED: 1 },
}))
vi.mock('tar-stream', () => tarMocks)

const streamPromisesMock = vi.hoisted(() => ({
  finished: vi.fn(() => true),
}))
vi.mock('stream/promises', async () => streamPromisesMock)

const registryMocks = vi.hoisted(() => ({
  doesImageLayerExist: vi.fn(),
  getImageBlob: vi.fn(() => ({ body: ReadableStream.from('test') })),
  getImageManifest: vi.fn(),
  initialiseImageUpload: vi.fn(),
  joinDistributionPackageName: vi.fn(() => 'localhost:8080/imageName:tag'),
  listModelImages: vi.fn(() => [] as { name: string; tags: string[] }[]),
  putImageBlob: vi.fn(),
  putImageManifest: vi.fn(),
  splitDistributionPackageName: vi.fn(() => ({
    domain: 'localhost:8080',
    path: 'imageName',
    tag: 'tag',
  })),
}))
vi.mock('../../src/services/registry.js', () => registryMocks)

class MockReadable extends EventEmitter implements NodeJS.ReadableStream {
  readable: boolean = true
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined }): T {
    this.emit('pipe', destination)
    return destination
  }
  [Symbol.asyncIterator](): NodeJS.AsyncIterator<string | Buffer> {
    throw new Error('Method not implemented.')
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  read(size?: number): string | Buffer {
    return 'data'
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setEncoding(encoding: BufferEncoding): this {
    return this
  }
  pause(): this {
    return this
  }
  resume(): this {
    return this
  }
  isPaused(): boolean {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unpipe(destination?: NodeJS.WritableStream): this {
    return this
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void {
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  wrap(oldStream: NodeJS.ReadableStream): this {
    return this
  }
}

class MockWritable extends EventEmitter implements NodeJS.WritableStream {
  writable: boolean = true
  finish() {
    // short delay
    setTimeout(() => this.emit('finish'), 10)
  }
  write() {
    return true
  }
  end(): this {
    this.emit('finish')
    return this
  }
  // Helper to trigger an error
  triggerError(error: Error) {
    this.emit('error', error)
  }
}

describe('services > mirroredModel', () => {
  test('exportModel > not enabled', async () => {
    vi.spyOn(configMock, 'ui', 'get').mockReturnValueOnce({ modelMirror: { export: { enabled: false } } })
    const response = exportModel({} as UserInterface, 'modelId', true)

    await expect(response).rejects.toThrowError('Exporting models has not been enabled.')
  })

  test('exportModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const response = exportModel({} as UserInterface, 'modelId', true)
    await expect(response).rejects.toThrowError(/^You do not have permission/)
  })

  test('exportModel > missing disclaimer agreement', async () => {
    const response = exportModel({} as UserInterface, 'modelId', false)
    await expect(response).rejects.toThrowError(
      /^You must agree to the disclaimer agreement before being able to export a model./,
    )
  })

  test('exportModel > unable to create model card zip file', async () => {
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true)
    await expect(response).rejects.toThrowError(/^Error when adding the model card revision\(s\) to the zip file./)
  })

  test('exportModel > unable to create release zip file', async () => {
    archiverMocks.append.mockReturnValueOnce({})
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await expect(response).rejects.toThrowError(/^Error when adding the release\(s\) to the zip file./)
  })

  test('exportModel > unable to create digest for zip file', async () => {
    hashMocks.createHash.mockImplementationOnce(() => {
      throw Error()
    })
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(
      expect.any(Object),
      'Failed to upload export to export location with signatures',
    )
  })

  test('exportModel > unable to create kms signature for zip file', async () => {
    // MockReadable isn't quite correct for this use case
    s3Mocks.getObjectStream.mockResolvedValueOnce({ Body: new PassThrough() })
    kmsMocks.sign.mockRejectedValueOnce('Error')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(
      expect.any(Object),
      'Failed to upload export to export location with signatures',
    )
  })

  test('exportModel > release export size too large', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    fileMocks.getTotalFileSize.mockReturnValueOnce(100)
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '1.2.4'])
    await expect(response).rejects.toThrowError(/^Requested export is too large./)
  })

  test('exportModel > successful export if no files exist', async () => {
    releaseMocks.getAllFileIds.mockResolvedValueOnce([])
    fileMocks.getFilesByIds.mockResolvedValueOnce([])
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '1.2.4'])
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))
  })

  test('exportModel > missing mirrored model ID', async () => {
    modelMocks.getModelById.mockReturnValueOnce({
      settings: { mirror: { destinationModelId: '' } },
      card: { schemaId: 'test' },
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await expect(response).rejects.toThrowError(/^The 'Destination Model ID' has not been set on this model./)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > missing mirrored model card schemaId', async () => {
    modelMocks.getModelById.mockReturnValueOnce({
      settings: { mirror: { destinationModelId: 'test' } },
      card: { schemaId: '' },
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await expect(response).rejects.toThrowError(
      /^You must select a schema for your model before you can start the export process./,
    )
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export contains infected file', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      {
        _id: '123',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '123', state: 'complete', isInfected: true }],
        toJSON: vi.fn(),
      },
      {
        _id: '321',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
        toJSON: vi.fn(),
      },
    ])
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await expect(response).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export contains incomplete file scan', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      {
        _id: '123',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '123', state: 'inProgress' }],
        toJSON: vi.fn(),
      } as any,
      {
        _id: '321',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
        toJSON: vi.fn(),
      },
    ])
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await expect(response).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export missing file scan', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      { _id: '123', toJSON: vi.fn() } as any,
      {
        _id: '321',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
        toJSON: vi.fn(),
      },
      {
        _id: '321',
        avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
        toJSON: vi.fn(),
      },
    ])
    const response = exportModel({} as UserInterface, 'testmod', true, ['1.2.3'])
    await expect(response).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > upload straight to the export bucket if signatures are disabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        bucket: 'exports',
        kmsSignature: {
          enabled: false,
        },
      },
    })

    await exportModel({} as UserInterface, 'modelId', true)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledWith(
      'modelId.zip',
      expect.any(Object),
      'exports',
      expect.any(Object),
    )
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(1)
  })

  test('exportModel > log error if unable to upload to export s3 storage', async () => {
    s3Mocks.putObjectStream.mockRejectedValueOnce('')
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        kmsSignature: {
          enabled: false,
        },
      },
    })

    await exportModel({} as UserInterface, 'modelId', true)
    expect(logMock.error).toHaveBeenCalledWith(expect.any(Object), 'Failed to export to export S3 location.')
  })

  test('exportModel > export uploaded to S3 with signatures', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        kmsSignature: {
          enabled: true,
        },
      },
    })
    await exportModel({} as UserInterface, 'modelId', true)
  })

  test('exportModel > export uploaded to S3 for model cards and releases', async () => {
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '3.2.1'])

    expect(s3Mocks.putObjectStream).toBeCalledTimes(2)
  })

  test('exportModel > export uploaded to S3 for model cards, releases and images', async () => {
    registryMocks.getImageManifest.mockResolvedValue({
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
      layers: [],
    })
    registryMocks.listModelImages.mockReturnValueOnce([
      { name: 'image1', tags: ['tag1', 'tag2'] },
      { name: 'image2', tags: [] },
      { name: 'image3', tags: ['tag3'] },
    ])
    releaseMocks.getReleasesForExport.mockResolvedValueOnce([
      {
        toJSON: vi.fn(),
        images: [
          { repository: '', name: 'image1', tag: 'tag1', toObject: vi.fn() },
          { repository: '', name: 'image1', tag: 'tag3', toObject: vi.fn() },
          { repository: '', name: 'image4', tag: 'tag3', toObject: vi.fn() },
        ],
      },
    ])

    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

    expect(s3Mocks.putObjectStream).toBeCalledTimes(5)
    expect(archiverMocks.append).toBeCalledTimes(3)
    expect(zlibMocks.createGzip).toBeCalledTimes(3)
    expect(tarMocks.pack).toBeCalledTimes(3)
  })

  test('exportModel > unable to upload to tmp S3 location', async () => {
    s3Mocks.putObjectStream.mockRejectedValueOnce('')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(expect.any(Object), 'Failed to export to temporary S3 location.')
  })

  test('exportModel > unable to get object from tmp S3 location', async () => {
    s3Mocks.getObjectStream.mockRejectedValueOnce('')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(expect.any(Object), 'Failed to retrieve stream from temporary S3 location.')
  })

  test('importModel > not enabled', async () => {
    vi.spyOn(configMock, 'ui', 'get').mockReturnValueOnce({ modelMirror: { import: { enabled: false } } })
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Importing models has not been enabled.')
  })

  test('importModel > mirrored model Id empty', async () => {
    const result = importModel({} as UserInterface, '', 'source-model-id', 'https://test.com', ImportKind.Documents)

    await expect(result).rejects.toThrowError('Missing mirrored model ID.')
  })

  test('importModel > auth failure', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({
      id: '',
      success: false,
      info: 'User does not have access to model',
    })
    const response = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )
    await expect(response).rejects.toThrowError(/^User does not have access to model/)
  })

  test('importModel > error when getting zip file', async () => {
    fetchMock.default.mockRejectedValueOnce('a')
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Unable to get the file.')
  })

  test('importModel > non 200 response when getting zip file', async () => {
    fetchMock.default.mockResolvedValueOnce({ ok: false, body: {} as any, text: vi.fn() })

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Unable to get the file.')
  })

  test('importModel > file missing from body', async () => {
    fetchMock.default.mockResolvedValueOnce({ ok: true, text: vi.fn() } as any)
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Unable to get the file.')
  })

  test('importModel > save each imported model card', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push(
      { path: '1.json', fileContents: JSON.stringify({ modelId: 'source-model-id' }) },
      { path: '2.json', fileContents: JSON.stringify({ modelId: 'source-model-id' }) },
    )

    const result = await importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    expect(result).toMatchSnapshot()
    expect(modelMocks.saveImportedModelCard).toBeCalledTimes(2)
  })

  test('importModel > failed to parse zip file', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'invalid.json',
      fileContents: JSON.stringify({ modelId: 'source-model-id' }),
    })

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Failed to parse zip file - Unrecognised file contents.')
  })

  test('importModel > cannot parse into model card', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: '1.json',
      fileContents: JSON.stringify({}),
    })
    modelMocks.isModelCardRevisionDoc.mockReturnValueOnce(false)

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError(/^Data cannot be converted into a model card./)
  })

  test('importModel > different model IDs in zip files', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push(
      {
        path: '1.json',
        fileContents: JSON.stringify({ modelId: 'abc' }),
      },
      {
        path: '2.json',
        fileContents: JSON.stringify({ modelId: 'cba' }),
      },
    )

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError(
      /^Zip file contains model cards that have a model ID that does not match the source model Id./,
    )
  })

  test('importModel > save each imported release', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push(
      {
        path: 'releases/test.json',
        fileContents: JSON.stringify({
          modelId: 'source-model-id',
          images: [{ repository: '', name: 'image1', tag: 'tag1', toObject: vi.fn() }],
        }),
      },
      {
        path: 'releases/foo.json',
        fileContents: JSON.stringify({
          modelId: 'source-model-id',
          images: [],
        }),
      },
    )
    vi.mocked(authorisation.releases).mockResolvedValue([{ success: true, id: 'string' }])
    releaseMocks.saveImportedRelease.mockResolvedValue({ modelId: 'source-model-id' })

    const result = await importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    expect(result).toMatchSnapshot()
    expect(releaseMocks.saveImportedRelease).toBeCalledTimes(2)
  })

  test('importModel > cannot parse into a release', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'releases/test.json',
      fileContents: JSON.stringify({ modelId: 'source-model-id' }),
    })
    releaseMocks.isReleaseDoc.mockReturnValueOnce(false)

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Data cannot be converted into a release.')
  })

  test('importModel > contains releases from an invalid model', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'releases/test.json',
      fileContents: JSON.stringify({ modelId: 'test' }),
    })

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError(
      'Zip file contains releases that have a model ID that does not match the source model Id.',
    )
  })

  test('importModel > cannot parse into a file', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'files/test.json',
      fileContents: JSON.stringify({ modelId: 'source-model-id' }),
    })
    fileMocks.isFileInterfaceDoc.mockReturnValueOnce(false)

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Data cannot be converted into a file.')
  })

  test('importModel > failed to check if file exists', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'files/test.json',
      fileContents: JSON.stringify({ modelId: 'source-model-id' }),
    })
    s3Mocks.objectExists.mockRejectedValueOnce('error')

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError('Failed to check if file exists.')
  })

  test('importModel > contains files from an invalid model', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push({
      path: 'files/test.json',
      fileContents: JSON.stringify({ modelId: 'test', path: 'test' }),
    })

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError(
      'Zip file contains files that have a model ID that does not match the source model Id.',
    )
  })

  test('importModel > save each imported file', async () => {
    mockUnzipperEntries.length = 0
    mockUnzipperEntries.push(
      {
        path: 'files/test.json',
        fileContents: JSON.stringify({ modelId: 'source-model-id', path: 'test' }),
      },
      {
        path: 'files/foo.json',
        fileContents: JSON.stringify({ modelId: 'source-model-id', path: 'test' }),
      },
    )

    const result = await importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    expect(result).toMatchSnapshot()
    expect(fileMocks.saveImportedFile).toBeCalledTimes(2)
  })

  test('importModel > invalid zip data', async () => {
    unzipperMock.Parse.mockImplementationOnce(() => {
      throw Error('Cannot import file.')
    })

    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Documents,
    )

    await expect(result).rejects.toThrowError(/^Cannot import file./)
  })

  test('importModel > missing file path for file imports', async () => {
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.File,
    )

    await expect(result).rejects.toThrowError(/^Missing File ID/)
  })

  test('importModel > uploads file to S3 on success', async () => {
    const result = await importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.File,
      '/s3/path/',
    )

    expect(result).toMatchSnapshot()
    expect(s3Mocks.putObjectStream).toBeCalledTimes(1)
  })

  test('importModel > missing image name for image imports', async () => {
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Image,
      undefined,
    )

    await expect(result).rejects.toThrowError(/^Missing Distribution Package Name./)
  })

  test('importModel > uploads image to S3 on success', async () => {
    // this is not a nice test because of the streams and events, but it does work

    // set up mock API responses
    fetchMock.default.mockResolvedValueOnce({ ok: true, body: new PassThrough(), text: vi.fn() })
    // inject our own `.on(<name>, cb)` method to get the handlers
    let storedEntryHandler
    let storedFinishHandler
    const mockTarStream = Object.assign(new MockReadable(), {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      on: vi.fn((eventName: string, callback: Function) => {
        // extract the wanted handlers
        if (eventName === 'entry') {
          storedEntryHandler = callback
        } else if (eventName === 'finish') {
          storedFinishHandler = callback
        }
      }),
    })
    tarMocks.extract.mockReturnValueOnce(mockTarStream)

    const promise = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      ImportKind.Image,
      undefined,
      'image-name:image-tag',
    )

    // have to wait for a tick otherwise handlers won't yet be set
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(storedEntryHandler).toBeDefined()
    expect(storedFinishHandler).toBeDefined()

    // inject `resume` function
    const eventStream = Object.assign(
      ReadableStream.from(
        JSON.stringify({
          schemaVersion: 2,
          mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
          config: {},
          layers: [],
        }),
      ),
      {
        resume: vi.fn(),
      },
    )
    storedEntryHandler({ name: 'manifest.json', type: 'file', size: 123 }, eventStream, () => {})

    // have to wait for a tick otherwise shared variable `manifestBody` may be undefined by the time `finish` triggers
    await new Promise((resolve) => setTimeout(resolve, 10))

    // send 'finish' event
    storedFinishHandler()

    const result = await promise
    expect(result).toMatchSnapshot()
    expect(fetchMock.default).toBeCalledTimes(1)
    expect(registryMocks.putImageManifest).toBeCalledTimes(1)
  })

  test('importModel > unrecognised import kind', async () => {
    const result = importModel(
      {} as UserInterface,
      'mirrored-model-id',
      'source-model-id',
      'https://test.com',
      'blah' as ImportKindKeys,
    )

    await expect(result).rejects.toThrowError(/^Unrecognised import kind/)
  })

  test('pipeStreamToTarEntry > success', async () => {
    const inputStream = new MockReadable()
    const packerEntry = new MockWritable()

    const promise = pipeStreamToTarEntry(inputStream, packerEntry, { test: 'data' })

    setTimeout(() => {
      packerEntry.emit('finish')
    }, 20)

    const result = await promise
    expect(result).toBe('ok')
  })

  test('pipeStreamToTarEntry > inputStream error', async () => {
    const inputStream = new MockReadable()
    const packerEntry = new MockWritable()

    const promise = pipeStreamToTarEntry(inputStream, packerEntry, { test: 'errorInput' })

    const error = new Error('input stream error')
    setTimeout(() => {
      inputStream.emit('error', error)
    }, 10)

    await expect(promise).rejects.toThrow('Error while fetching layer stream')
  })

  test('pipeStreamToTarEntry > packerEntry error', async () => {
    const inputStream = new MockReadable()
    const packerEntry = new MockWritable()

    const promise = pipeStreamToTarEntry(inputStream, packerEntry, { test: 'errorPacker' })

    const error = new Error('packer error')
    setTimeout(() => {
      packerEntry.emit('error', error)
    }, 10)

    await expect(promise).rejects.toThrow('Error while tarring layer stream')
  })

  test('exportCompressedRegistryImage > success', async () => {
    registryMocks.getImageBlob
      .mockResolvedValueOnce({ body: ReadableStream.from('test') })
      .mockResolvedValueOnce({ body: ReadableStream.from('x'.repeat(256)) })
      .mockResolvedValueOnce({ body: ReadableStream.from('a'.repeat(512)) })
    registryMocks.getImageManifest.mockResolvedValueOnce({
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
      layers: [
        { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 256, digest: 'sha256:1' },
        { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 512, digest: 'sha256:2' },
      ],
    })

    await exportCompressedRegistryImage({} as UserInterface, 'modelId', 'imageName:tag', {} as any)

    expect(zlibMocks.createGzip).toBeCalledTimes(1)
    expect(tarMocks.pack).toBeCalledTimes(1)
    expect(registryMocks.getImageManifest).toBeCalledTimes(1)
    expect(registryMocks.getImageBlob).toBeCalledTimes(3)
  })

  test('exportCompressedRegistryImage > missing layer digest', async () => {
    registryMocks.getImageManifest.mockResolvedValueOnce({
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
      layers: [{ mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 256, digest: '' }],
    })

    const promise = exportCompressedRegistryImage({} as UserInterface, 'modelId', 'imageName:tag', {} as any)

    await expect(promise).rejects.toThrow('Could not extract layer digest.')

    expect(zlibMocks.createGzip).toBeCalledTimes(1)
    expect(tarMocks.pack).toBeCalledTimes(1)
    expect(registryMocks.getImageManifest).toBeCalledTimes(1)
    expect(registryMocks.getImageBlob).toBeCalledTimes(1)
  })

  test('importCompressedRegistryImage > success', async () => {
    // this is not a nice test because of the streams and events, but it does work

    // set up mock API responses
    registryMocks.doesImageLayerExist.mockResolvedValueOnce(true).mockResolvedValue(false)
    registryMocks.initialiseImageUpload.mockResolvedValue({
      'content-length': 'string',
      date: 'string',
      'docker-distribution-api-version': 'string',
      'docker-upload-uuid': 'string',
      location: 'string',
      range: 'string',
    })
    registryMocks.putImageBlob.mockResolvedValue({
      'content-length': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      location: 'string',
    })
    registryMocks.putImageManifest.mockResolvedValueOnce({
      'content-length': 'string',
      date: 'string',
      'docker-content-digest': 'string',
      'docker-distribution-api-version': 'string',
      location: 'string',
    })
    // set up mock stream responses
    const mockTarExtractEntryEntries = [
      { name: 'manifest.json', type: 'file', size: 123 },
      { name: 'blobs/sha256/0', type: 'file', size: 4 },
      { name: 'blobs/sha256/1', type: 'file', size: 256 },
      { name: 'blobs/sha256/2', type: 'file', size: 512 },
      { name: 'blobs/sha256', type: 'directory', size: 0 },
    ]
    const mockTarExtractEntryStreamEvents: string[] = [
      JSON.stringify({
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
        layers: [
          { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 256, digest: 'sha256:1' },
          { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 512, digest: 'sha256:2' },
        ],
      }),
      'test',
      'x'.repeat(256),
      'a'.repeat(512),
      '',
    ]
    expect(mockTarExtractEntryEntries.length).toEqual(mockTarExtractEntryStreamEvents.length)
    // inject our own `.on(<name>, cb)` method to get the handlers
    let storedEntryHandler
    let storedFinishHandler
    const mockTarStream = Object.assign(new MockReadable(), {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      on: vi.fn((eventName: string, callback: Function) => {
        // extract the wanted handlers
        if (eventName === 'entry') {
          storedEntryHandler = callback
        } else if (eventName === 'finish') {
          storedFinishHandler = callback
        }
      }),
    })
    tarMocks.extract.mockReturnValueOnce(mockTarStream)

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      new PassThrough(),
      'modelId',
      'imageName:tag',
      'importId',
    )

    // have to wait for a tick otherwise handlers won't yet be set
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(storedEntryHandler).toBeDefined()
    expect(storedFinishHandler).toBeDefined()

    // for each 'entry' event
    for (let mockIndex = 0; mockIndex < mockTarExtractEntryEntries.length; mockIndex++) {
      // inject `resume` function
      const eventStream = Object.assign(ReadableStream.from(mockTarExtractEntryStreamEvents[mockIndex]), {
        resume: vi.fn(),
      })
      storedEntryHandler(mockTarExtractEntryEntries[mockIndex], eventStream, () => {})

      // have to wait for a tick otherwise shared variable `manifestBody` may be undefined by the time `finish` triggers
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    // send 'finish' event
    storedFinishHandler()

    await promise

    expect(zlibMocks.createGunzip).toBeCalledTimes(1)
    expect(tarMocks.extract).toBeCalledTimes(1)
    expect(registryMocks.doesImageLayerExist).toBeCalledTimes(3)
    expect(registryMocks.initialiseImageUpload).toBeCalledTimes(2)
    expect(registryMocks.putImageBlob).toBeCalledTimes(2)
    expect(registryMocks.putImageManifest).toBeCalledTimes(1)
  })

  test('importCompressedRegistryImage > error due to missing manifest.json', async () => {
    // this is not a nice test because of the streams and events, but it does work

    // set up mock API responses
    registryMocks.doesImageLayerExist.mockResolvedValue(true)
    // inject our own `.on(<name>, cb)` method to get the handlers
    let storedEntryHandler
    let storedFinishHandler
    const mockTarStream = Object.assign(new MockReadable(), {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      on: vi.fn((eventName: string, callback: Function) => {
        // extract the wanted handlers
        if (eventName === 'entry') {
          storedEntryHandler = callback
        } else if (eventName === 'finish') {
          storedFinishHandler = callback
        }
      }),
    })
    tarMocks.extract.mockReturnValueOnce(mockTarStream)

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      new PassThrough(),
      'modelId',
      'imageName:tag',
      'importId',
    )

    // have to wait for a tick otherwise handlers won't yet be set
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(storedEntryHandler).toBeDefined()
    expect(storedFinishHandler).toBeDefined()

    // inject `resume` function
    const eventStream = Object.assign(ReadableStream.from('test'), {
      resume: vi.fn(),
    })
    storedEntryHandler({ name: 'blobs/sha256/0', type: 'file', size: 4 }, eventStream, () => {})

    // have to wait for a tick otherwise shared variable `manifestBody` may be undefined by the time `finish` triggers
    await new Promise((resolve) => setTimeout(resolve, 10))

    // send 'finish' event
    storedFinishHandler()

    await expect(promise).rejects.toThrow('Could not find manifest.json in tarball')

    expect(zlibMocks.createGunzip).toBeCalledTimes(1)
    expect(tarMocks.extract).toBeCalledTimes(1)
    expect(registryMocks.doesImageLayerExist).toBeCalledTimes(1)
    expect(registryMocks.initialiseImageUpload).toBeCalledTimes(0)
    expect(registryMocks.putImageBlob).toBeCalledTimes(0)
    expect(registryMocks.putImageManifest).toBeCalledTimes(0)
  })

  test('importCompressedRegistryImage > tar error', async () => {
    // this is not a nice test because of the streams and events, but it does work

    // inject our own `.on(<name>, cb)` method to get the handlers
    let storedErrorHandler
    const mockTarStream = Object.assign(new MockReadable(), {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      on: vi.fn((eventName: string, callback: Function) => {
        // extract the wanted handlers
        if (eventName === 'error') {
          storedErrorHandler = callback
        }
      }),
    })
    tarMocks.extract.mockReturnValueOnce(mockTarStream)

    const promise = importCompressedRegistryImage(
      {} as UserInterface,
      (await s3Mocks.getObjectStream()).Body as Readable,
      'modelId',
      'imageName:tag',
      'importId',
    )

    // have to wait for a tick otherwise handlers won't yet be set
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(storedErrorHandler).toBeDefined()

    storedErrorHandler({})

    await expect(promise).rejects.toThrow('Error while un-tarring blob')

    expect(s3Mocks.getObjectStream).toBeCalledTimes(1)
    expect(zlibMocks.createGunzip).toBeCalledTimes(1)
    expect(tarMocks.extract).toBeCalledTimes(1)
  })
})
