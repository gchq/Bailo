import { PassThrough, Readable } from 'node:stream'

import PQueue from 'p-queue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Response } from '../../../src/connectors/authorisation/base.js'
import authorisation from '../../../src/connectors/authorisation/index.js'
import { FileScanResult } from '../../../src/connectors/fileScanning/Base.js'
import { ArtefactKind } from '../../../src/models/Scan.js'
import { UserInterface } from '../../../src/models/User.js'
import {
  exportCompressedRegistryImage,
  exportModel,
  generateDigest,
  ImportKind,
  ImportKindKeys,
  importModel,
  uploadReleaseFiles,
  uploadReleaseImages,
} from '../../../src/services/mirroredModel/mirroredModel.js'

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
vi.mock('../../../src/connectors/fileScanning/index.js', async () => ({ default: fileScanningMock }))

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({ ok: true, body: ReadableStream.from('test'), text: vi.fn() })),
}))
vi.mock('node-fetch', async () => fetchMock)

const queueMock = vi.hoisted(() => ({
  add: vi.fn(async (job) => {
    await job()
  }),
}))
vi.mock('p-queue', async () => ({ default: vi.fn(() => queueMock) }))

const authMock = vi.hoisted(() => ({
  model: vi.fn<() => Response>(() => ({ id: 'test', success: true })),
  releases: vi.fn<() => Response[]>(() => []),
}))
vi.mock('../../../src/connectors/authorisation/index.js', async () => ({
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
        },
      },
    }) as any,
)
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const tarballMocks = vi.hoisted(() => ({
  createTarGzStreams: vi.fn(),
  pipeStreamToTarEntry: vi.fn(() => Promise.resolve('ok')),
}))
vi.mock('../../../src/utils/tarball.js', () => tarballMocks)

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({
    id: 'modelId',
    settings: { mirror: { destinationModelId: 'abc' } },
    card: { schemaId: 'schemaId' },
  })),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(() => ({})), version: 123 }] as any[]),
  validateMirroredModel: vi.fn(() => ({
    settings: { mirror: { destinationModelId: 'abc' } },
    card: { schemaId: 'schemaId' },
  })),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  getReleasesForExport: vi.fn(
    () =>
      [
        {
          toJSON: vi.fn(() => ({})),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          images: [] as { repository: string; name: string; tag: string; toObject: Function }[],
          semver: '1.2.3',
        },
      ] as any[],
  ),
  getAllFileIds: vi.fn(() => [] as string[]),
}))
vi.mock('../../../src/services/release.js', () => releaseMocks)

const s3Mocks = vi.hoisted(() => ({
  uploadToS3: vi.fn(),
}))
vi.mock('../../../src/services/mirroredModel/s3.js', () => s3Mocks)

const documentImporterMocks = vi.hoisted(() => ({
  importDocuments: vi.fn(() =>
    Promise.resolve({
      mirroredModel: 'updatedMirroredModel',
      importResult: {
        modelCardVersions: [],
        newModelCards: [],
        releaseSemvers: [],
        newReleases: [],
        fileIds: [],
        imageIds: [],
      },
    }),
  ),
}))
vi.mock('../../../src/services/mirroredModel/importers/documentImporter.js', () => documentImporterMocks)

const fileImporterMocks = vi.hoisted(() => ({
  importModelFile: vi.fn(() => Promise.resolve({ sourcePath: '/source/path', newPath: '/new/path' })),
}))
vi.mock('../../../src/services/mirroredModel/importers/fileImporter.js', () => fileImporterMocks)

const imageImporterMocks = vi.hoisted(() => ({
  importCompressedRegistryImage: vi.fn(() =>
    Promise.resolve({ image: { modelId: 'modelId', imageName: 'imageName', imageTag: 'imageTag' } }),
  ),
}))
vi.mock('../../../src/services/mirroredModel/importers/imageImporter.js', () => imageImporterMocks)

const fileMocks = vi.hoisted(() => ({
  createFilePath: vi.fn(() => 'file/path'),
  downloadFile: vi.fn(() => ({ Body: 'test' })),
  getFilesByIds: vi.fn(() => [
    {
      _id: { toString: vi.fn(() => 'fileId') },
      avScan: [{ ArtefactKind: ArtefactKind.File, fileId: 'fileId', state: 'complete', isInfected: false }],
      toJSON: vi.fn(),
    },
  ]),
  getTotalFileSize: vi.fn(() => 42),
}))
vi.mock('../../../src/services/file.js', () => fileMocks)

const registryMocks = vi.hoisted(() => ({
  getImageBlob: vi.fn(() => ({ stream: ReadableStream.from('test'), abort: vi.fn() })),
  getImageManifest: vi.fn(),
  joinDistributionPackageName: vi.fn(() => 'localhost:8080/imageName:tag'),
  splitDistributionPackageName: vi.fn(() => ({
    domain: 'localhost:8080',
    path: 'imageName',
    tag: 'tag',
  })),
}))
vi.mock('../../../src/services/registry.js', () => registryMocks)

describe('services > mirroredModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const tarStreamMock = new PassThrough()
    Object.assign(tarStreamMock, {
      entry: vi.fn(() => {
        const writable = new PassThrough()
        // simulate finish event after some delay on write
        setImmediate(() => writable.emit('finish'))
        return writable
      }),
      pipe: vi.fn().mockReturnThis(),
      finalize: vi.fn(),
    })
    tarballMocks.createTarGzStreams.mockReturnValue({ gzipStream: new PassThrough(), tarStream: tarStreamMock })
  })

  describe('exportModel', () => {
    test('not enabled', async () => {
      vi.spyOn(configMock, 'ui', 'get').mockReturnValueOnce({ modelMirror: { export: { enabled: false } } })

      const promise = exportModel({} as UserInterface, 'modelId', true)

      await expect(promise).rejects.toThrowError('Exporting models has not been enabled.')
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('missing disclaimer agreement', async () => {
      const promise = exportModel({} as UserInterface, 'modelId', false)

      await expect(promise).rejects.toThrowError(
        /^You must agree to the disclaimer agreement before being able to export a model./,
      )
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('missing mirrored model ID', async () => {
      modelMocks.getModelById.mockReturnValueOnce({
        id: '123',
        settings: { mirror: { destinationModelId: '' } },
        card: { schemaId: 'schemaId' },
      })

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError(/^The 'Destination Model ID' has not been set on this model./)
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('missing mirrored model card schemaId', async () => {
      modelMocks.getModelById.mockReturnValueOnce({
        id: '123',
        settings: { mirror: { destinationModelId: 'abc' } },
        card: { schemaId: '' },
      })

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError(
        /^You must select a schema for your model before you can start the export process./,
      )
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('bad authorisation', async () => {
      vi.mocked(authorisation.model).mockResolvedValueOnce({
        info: 'You do not have permission',
        success: false,
        id: '',
      })

      const promise = exportModel({} as UserInterface, 'modelId', true)

      await expect(promise).rejects.toThrowError(/^You do not have permission/)
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('successful export if no files exist', async () => {
      releaseMocks.getAllFileIds.mockResolvedValueOnce([])
      modelMocks.getModelCardRevisions.mockResolvedValueOnce([])
      fileMocks.getFilesByIds.mockResolvedValue([])

      await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      expect(authMock.model).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalledWith({} as UserInterface, 'modelId', ['1.2.3'])
      expect(tarballMocks.createTarGzStreams).toHaveBeenCalled()
      expect(s3Mocks.uploadToS3).toHaveBeenCalled()
      expect(logMock.debug).toHaveBeenCalledWith(
        { modelId: 'modelId', semvers: ['1.2.3'] },
        'Successfully finalized Tarball file.',
      )
    })

    test('throw error when addModelCardRevisionsToTarball fails', async () => {
      modelMocks.getModelCardRevisions.mockResolvedValueOnce([{ toJSON: vi.fn() }])

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrow('Error when adding the model card revision(s) to the Tarball file.')
      expect(authMock.model).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalledWith({} as UserInterface, 'modelId', ['1.2.3'])
      expect(tarballMocks.createTarGzStreams).toHaveBeenCalled()
      expect(s3Mocks.uploadToS3).toHaveBeenCalled()
      expect(logMock.debug).not.toHaveBeenCalledWith(
        { modelId: 'modelId', semvers: ['1.2.3'] },
        'Successfully finalized Tarball file.',
      )
    })

    test('throw error when addReleasesToTarball fails', async () => {
      releaseMocks.getAllFileIds.mockResolvedValueOnce([])
      modelMocks.getModelCardRevisions.mockResolvedValueOnce([])
      fileMocks.getFilesByIds.mockResolvedValueOnce([])
      tarballMocks.pipeStreamToTarEntry.mockImplementationOnce(() => {
        throw Error()
      })

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrow('Error when adding the release(s) to the Tarball file.')
      expect(authMock.model).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalledWith({} as UserInterface, 'modelId', ['1.2.3'])
      expect(tarballMocks.createTarGzStreams).toHaveBeenCalled()
      expect(s3Mocks.uploadToS3).toHaveBeenCalled()
      expect(logMock.debug).not.toHaveBeenCalledWith(
        { modelId: 'modelId', semvers: ['1.2.3'] },
        'Successfully finalized Tarball file.',
      )
    })

    test('skip export contains incomplete file scan', async () => {
      fileMocks.getFilesByIds.mockReturnValueOnce([
        {
          avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '123', state: 'inProgress' }],
          toJSON: vi.fn(),
        } as any,
        {
          avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
          toJSON: vi.fn(),
        } as any,
      ])

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('skip export missing file scans', async () => {
      fileMocks.getFilesByIds.mockReturnValueOnce([
        {
          _id: '123',
          avScan: [],
          toJSON: vi.fn(),
        } as any,
      ])

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('export contains infected file', async () => {
      fileMocks.getFilesByIds.mockReturnValueOnce([
        {
          avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '123', state: 'complete', isInfected: true }],
          toJSON: vi.fn(),
        } as any,
        {
          avScan: [{ ArtefactKind: ArtefactKind.File, fileId: '321', state: 'complete', isInfected: false }],
          toJSON: vi.fn(),
        } as any,
      ])

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('export missing file scan', async () => {
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

      const promise = exportModel({} as UserInterface, 'testmod', true, ['1.2.3'])

      await expect(promise).rejects.toThrowError('The releases contain file(s) that do not have a clean AV scan.')
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })

    test('release export size too large', async () => {
      releaseMocks.getAllFileIds.mockResolvedValueOnce(['fileId'])
      vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
        enabled: true,
        export: {
          maxSize: 10,
        },
      })
      fileMocks.getTotalFileSize.mockReturnValueOnce(100)

      const promise = exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '1.2.4'])

      await expect(promise).rejects.toThrowError(/^Requested export is too large./)
      expect(authMock.model).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalledWith({} as UserInterface, 'modelId', ['1.2.3', '1.2.4'])
      expect(tarballMocks.createTarGzStreams).not.toHaveBeenCalled()
    })
  })

  describe('importModel', () => {
    test('not enabled', async () => {
      vi.spyOn(configMock, 'ui', 'get').mockReturnValueOnce({ modelMirror: { import: { enabled: false } } })
      const promise = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )

      await expect(promise).rejects.toThrowError('Importing models has not been enabled.')
    })

    test('mirrored model ID empty', async () => {
      const result = importModel({} as UserInterface, '', 'source-model-id', 'https://test.com', ImportKind.Documents)

      await expect(result).rejects.toThrowError('Missing mirrored model ID.')
    })

    test('auth failure', async () => {
      vi.mocked(authorisation.model).mockResolvedValueOnce({
        id: '',
        success: false,
        info: 'User does not have access to model',
      })
      const promise = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )
      await expect(promise).rejects.toThrowError(/^User does not have access to model/)
    })

    test('error when getting file', async () => {
      fetchMock.default.mockRejectedValueOnce('failure')
      const result = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )

      await expect(result).rejects.toThrowError('Unable to get the file.')
    })

    test('non-200 response when getting file', async () => {
      fetchMock.default.mockResolvedValueOnce({ ok: false, body: {}, text: vi.fn() } as any)
      const result = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )

      await expect(result).rejects.toThrowError('Unable to get the file.')
    })

    test('file missing from body', async () => {
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

    test('importDocuments on document success', async () => {
      const result = await importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )

      expect(result).toMatchSnapshot()
      expect(modelMocks.validateMirroredModel).toHaveBeenCalled()
      expect(authMock.model).toHaveBeenCalled()
      expect(fetchMock.default).toHaveBeenCalled()
      expect(documentImporterMocks.importDocuments).toHaveBeenCalled()
    })

    test('call Readable.fromWeb when res.body is not a Readable', async () => {
      fetchMock.default.mockResolvedValueOnce({
        ok: true,
        body: Readable.toWeb(new PassThrough()),
        text: vi.fn(),
      } as any)

      const result = await importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Documents,
      )

      expect(result).toMatchSnapshot()
      expect(modelMocks.validateMirroredModel).toHaveBeenCalled()
      expect(authMock.model).toHaveBeenCalled()
      expect(fetchMock.default).toHaveBeenCalled()
      expect(documentImporterMocks.importDocuments).toHaveBeenCalled()
    })

    test('missing file path for file imports', async () => {
      const result = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.File,
      )

      await expect(result).rejects.toThrowError(/^File ID must be specified for file import./)
    })

    test('importModelFile on file success', async () => {
      const result = await importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.File,
        '/s3/path/',
      )

      expect(result).toMatchSnapshot()
      expect(modelMocks.validateMirroredModel).toHaveBeenCalled()
      expect(authMock.model).toHaveBeenCalled()
      expect(fetchMock.default).toHaveBeenCalled()
      expect(fileImporterMocks.importModelFile).toHaveBeenCalled()
    })

    test('missing image name for image imports', async () => {
      const result = importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Image,
      )

      await expect(result).rejects.toThrowError(/^Missing Distribution Package Name./)
    })

    test('importCompressedRegistryImage on image success', async () => {
      const result = await importModel(
        {} as UserInterface,
        'mirrored-model-id',
        'source-model-id',
        'https://test.com',
        ImportKind.Image,
        undefined,
        'image-name:image-tag',
      )

      expect(result).toMatchSnapshot()
      expect(modelMocks.validateMirroredModel).toHaveBeenCalled()
      expect(authMock.model).toHaveBeenCalled()
      expect(fetchMock.default).toHaveBeenCalled()
      expect(imageImporterMocks.importCompressedRegistryImage).toHaveBeenCalled()
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
  })

  describe('uploadReleaseFiles', () => {
    test('upload release files', async () => {
      await uploadReleaseFiles(
        {} as UserInterface,
        { id: 'modelId' } as any,
        { id: 'releaseId', semver: '1.2.3' } as any,
        [{ id: 'fileId1' }, { id: 'fileId2' }] as any[],
        'mirroredModelId',
        queueMock as unknown as PQueue,
      )

      expect(queueMock.add).toBeCalledTimes(2)
      expect(s3Mocks.uploadToS3).toBeCalledTimes(2)
      expect(fileMocks.downloadFile).toBeCalledTimes(2)
    })
  })

  describe('uploadReleaseImages', () => {
    test('upload release images', async () => {
      registryMocks.getImageManifest.mockResolvedValue({ layers: [] })

      await uploadReleaseImages(
        {} as UserInterface,
        { id: 'modelId' } as any,
        {
          id: 'releaseId',
          semver: '1.2.3',
          images: [
            { name: 'name', tag: 'tag', repository: 'repository', _id: 'imageId' },
            { name: 'name', tag: 'tag', repository: 'repository', _id: 'imageId' },
          ],
        } as any,
        'mirroredModelId',
        queueMock as unknown as PQueue,
      )

      expect(registryMocks.getImageManifest).toBeCalledTimes(2)
      expect(tarballMocks.createTarGzStreams).toBeCalledTimes(2)
      expect(s3Mocks.uploadToS3).toBeCalledTimes(2)
      expect(queueMock.add).toBeCalledTimes(2)
    })

    test('error', async () => {
      registryMocks.getImageManifest.mockImplementationOnce(() => {
        throw Error()
      })

      await uploadReleaseImages(
        {} as UserInterface,
        { id: 'modelId' } as any,
        {
          id: 'releaseId',
          semver: '1.2.3',
          images: [
            { name: 'name', tag: 'tag', repository: 'repository' },
            { name: 'name', tag: 'tag', repository: 'repository' },
          ],
        } as any,
        'mirroredModelId',
        queueMock as unknown as PQueue,
      )

      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: 'modelId' }),
        'Error when uploading Release Image to S3.',
      )
    })
  })

  describe('exportCompressedRegistryImage', () => {
    test('throw if no tag in distributionPackageNameObject', async () => {
      registryMocks.splitDistributionPackageName.mockReturnValueOnce({ domain: 'domain', path: 'path' } as any)

      await expect(
        exportCompressedRegistryImage({} as UserInterface, 'modelId', 'distName', 'filename', {} as any),
      ).rejects.toThrow(/^Distribution Package Name must include a tag./)
      expect(registryMocks.getImageManifest).not.toBeCalled()
    })

    test('export compressed registry image', async () => {
      registryMocks.getImageBlob
        .mockResolvedValueOnce({ stream: ReadableStream.from('test'), abort: vi.fn() })
        .mockResolvedValueOnce({ stream: ReadableStream.from('x'.repeat(256)), abort: vi.fn() })
        .mockResolvedValueOnce({ stream: ReadableStream.from('a'.repeat(512)), abort: vi.fn() })
      registryMocks.getImageManifest.mockResolvedValueOnce({
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
        layers: [
          { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 256, digest: 'sha256:1' },
          { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 512, digest: 'sha256:2' },
        ],
      })

      await exportCompressedRegistryImage({} as UserInterface, 'modelId', 'imageName:tag', 'filename', {} as any)

      expect(registryMocks.getImageManifest).toBeCalledTimes(1)
      expect(tarballMocks.createTarGzStreams).toBeCalledTimes(1)
      expect(s3Mocks.uploadToS3).toBeCalledTimes(1)
      expect(tarballMocks.pipeStreamToTarEntry).toBeCalledTimes(4)
      expect(registryMocks.getImageBlob).toBeCalledTimes(3)
    })

    test('throw if missing layer digest', async () => {
      registryMocks.getImageManifest.mockResolvedValueOnce({
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { mediaType: 'application/vnd.docker.container.image.v1+json', size: 4, digest: 'sha256:0' },
        layers: [{ mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', size: 256, digest: '' }],
      })

      const promise = exportCompressedRegistryImage(
        {} as UserInterface,
        'modelId',
        'imageName:tag',
        'filename',
        {} as any,
      )

      await expect(promise).rejects.toThrow('Could not extract layer digest.')
      expect(registryMocks.getImageManifest).toBeCalledTimes(1)
      expect(tarballMocks.createTarGzStreams).toBeCalledTimes(1)
      expect(s3Mocks.uploadToS3).toBeCalledTimes(1)
      expect(tarballMocks.pipeStreamToTarEntry).toBeCalledTimes(2)
      expect(registryMocks.getImageBlob).toBeCalledTimes(1)
    })
  })

  describe('generateDigest', () => {
    test('generate SHA256 digest from stream', async () => {
      const inputStream = new PassThrough()
      setImmediate(() => {
        inputStream.write('abc')
        inputStream.end()
      })

      const digest = await generateDigest(inputStream)

      expect(typeof digest).toBe('string')
      expect(digest.length).toBe(64)
      expect(digest).toMatch(/^[a-f0-9]{64}$/)
    })

    test('throws InternalError on generate digest failure', async () => {
      await expect(
        generateDigest({
          pipe: () => {
            throw new Error('fail')
          },
        } as any),
      ).rejects.toThrow('Error generating SHA256 digest for stream.')
    })
  })
})
