import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  addAndFinaliseExporters,
  addCompressedRegistryImageComponents,
  exportModel,
  generateDigest,
  getImporter,
  importModel,
} from '../../../src/services/mirroredModel/mirroredModel.js'
import { MirrorKind } from '../../../src/types/types.js'
import config from '../../../src/utils/config.js'
import { BadReq, InternalError } from '../../../src/utils/error.js'

vi.mock('../../../src/utils/config.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/utils/config.js')>('../../../src/utils/config.js')
  const mutableConfig = structuredClone(actual.default)

  return { __esModule: true, default: mutableConfig }
})
config.ui = {
  modelMirror: {
    import: { enabled: true },
    export: { enabled: true },
  },
} as any
config.modelMirror = { export: { concurrency: 1 }, metadataFile: 'meta.json' } as any

const logMock = vi.hoisted(() => ({ info: vi.fn(), debug: vi.fn(), error: vi.fn() }))
vi.mock('../../../src/services/log.js', () => ({ default: logMock }))

const shortIdMock = vi.hoisted(() =>
  vi.fn(function () {
    return 'shortId123'
  }),
)
vi.mock('../../../src/utils/id.js', () => ({ shortId: shortIdMock }))

const getHttpsAgentMock = vi.hoisted(() =>
  vi.fn(function () {
    return {}
  }),
)
vi.mock('../../../src/services/http.js', () => ({ getHttpsAgent: getHttpsAgentMock }))

const getModelByIdMock = vi.hoisted(() =>
  vi.fn(function () {
    return {
      id: 'modelId',
      card: {
        schemaId: 'minimal-general-v10',
        version: 2,
        mirrored: false,
        metadata: {
          overview: 'test',
        },
      },
      settings: { mirror: { destinationModelId: 'dest123' } },
    }
  }),
)
vi.mock('../../../src/services/model.js', () => ({
  getModelById: getModelByIdMock,
  getModelByIdNoAuth: getModelByIdMock,
  getModelSystemRoles: vi.fn(() => ['owner']),
}))

const fetchMock = vi.hoisted(() =>
  vi.fn(function () {
    return { ok: true, body: Readable.from(['data']), text: vi.fn() } as any
  }),
)
vi.mock('node-fetch', () => ({ default: fetchMock }))

const tarballMocks = vi.hoisted(() => ({
  addEntryToTarGzUpload: vi.fn(),
  extractTarGzStream: vi.fn(function () {
    return {
      metadata: { mirroredModelId: 'dest123' },
    }
  }),
}))
vi.mock('../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const registryMocks = vi.hoisted(() => ({
  splitDistributionPackageName: vi.fn(function () {
    return {
      path: 'img',
      tag: 'tag',
    }
  }),
  getImageManifest: vi.fn(),
  getImageBlob: vi.fn(),
}))
vi.mock('../../../src/services/registry.js', () => registryMocks)

const compressedLayerMediaType = 'application/vnd.docker.image.rootfs.diff.tar.gzip'

const registryClientMocks = vi.hoisted(() => ({
  getImageTagManifests: vi.fn(function () {
    return Promise.resolve({
      body: {
        config: { digest: 'sha256:config123', size: 1000, mediaType: 'application/vnd.docker.container.image.v1+json' },
        layers: [{ digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType }],
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      },
      headers: {
        'docker-content-digest': 'sha256:manifest123',
        'content-type': 'application/vnd.docker.distribution.manifest.v2+json',
      },
    })
  }),
  getImageTagManifestsRaw: vi.fn(function () {
    return Promise.resolve({
      body: JSON.stringify({
        config: { digest: 'sha256:config123', size: 1000, mediaType: 'application/vnd.docker.container.image.v1+json' },
        layers: [{ digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType }],
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      }),
      headers: {
        'docker-content-digest': 'sha256:manifest123',
        'content-type': 'application/vnd.docker.distribution.manifest.v2+json',
      },
    })
  }),
}))
vi.mock('../../../src/clients/registry.js', () => registryClientMocks)

const issueAccessTokenMock = vi.hoisted(() =>
  vi.fn(function () {
    return Promise.resolve('mock-token')
  }),
)
vi.mock('../../../src/routes/v1/registryAuth.js', () => ({
  issueAccessToken: issueAccessTokenMock,
}))

const getImageLayersMock = vi.hoisted(() =>
  vi.fn(function () {
    return Promise.resolve([
      { digest: 'sha256:config123', size: 1000, mediaType: 'application/vnd.docker.container.image.v1+json' },
      { digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType },
    ])
  }),
)
vi.mock('../../../src/services/images/getImageLayers.js', () => ({
  getImageLayers: getImageLayersMock,
}))

const releaseMocks = vi.hoisted(() => ({
  getReleasesForExport: vi.fn(function () {
    return Promise.resolve([{ id: 'rel1', semver: '1.0.0', images: [] }])
  }),
}))
vi.mock('../../../src/services/release.js', () => releaseMocks)

const DocumentsExporterMock = vi.hoisted(() => {
  return vi.fn(function () {
    const instance = {
      init: vi.fn(function () {
        return Promise.resolve(instance)
      }),
      getModel: vi.fn(function () {
        return {
          id: 'modelId',
          card: {
            schemaId: 'minimal-general-v10',
            version: 2,
            mirrored: false,
            metadata: {
              overview: 'test',
            },
          },
          settings: { mirror: { destinationModelId: 'dest123' } },
        }
      }),
      checkAuths: vi.fn(function () {
        return Promise.resolve()
      }),
      getReleases: vi.fn(function () {
        return [{ id: 'rel1', semver: '1.0.0', images: [] }]
      }),
      addData: vi.fn(function () {
        return Promise.resolve()
      }),
      finalise: vi.fn(function () {
        return Promise.resolve()
      }),
      getFiles: vi.fn(function () {
        return []
      }),
    }
    return instance
  })
})
vi.mock('../../../src/services/mirroredModel/exporters/documents.js', () => ({
  DocumentsExporter: DocumentsExporterMock,
}))

const FileExporterMock = vi.hoisted(() => {
  return vi.fn(function () {
    const instance = {
      init: vi.fn(function () {
        return Promise.resolve(instance)
      }),
      addData: vi.fn(function () {
        return Promise.resolve()
      }),
      finalise: vi.fn(function () {
        return Promise.resolve()
      }),
      getLogData: vi.fn(function () {}),
    }
    return instance
  })
})
vi.mock('../../../src/services/mirroredModel/exporters/file.js', () => ({ FileExporter: FileExporterMock }))

const ImageExporterMock = vi.hoisted(() => {
  return vi.fn(function () {
    const instance = {
      init: vi.fn(function () {
        return Promise.resolve(instance)
      }),
      addData: vi.fn(function () {
        return Promise.resolve()
      }),
      finalise: vi.fn(function () {
        return Promise.resolve()
      }),
    }
    return instance
  })
})
vi.mock('../../../src/services/mirroredModel/exporters/image.js', () => ({ ImageExporter: ImageExporterMock }))

const DocumentsImporterMock = vi.hoisted(() => ({
  DocumentsImporter: vi.fn(function () {
    return {
      mocked: 'documents',
    }
  }),
  DocumentsMirrorMetadata: vi.fn(),
  MongoDocumentMirrorInformation: vi.fn(),
}))
vi.mock('../../../src/services/mirroredModel/importers/documents.js', () => DocumentsImporterMock)

const FileImporterMock = vi.hoisted(() => ({
  FileImporter: vi.fn(function () {
    return {
      mocked: 'file',
    }
  }),
  FileMirrorMetadata: vi.fn(),
  FileMirrorInformation: vi.fn(),
}))
vi.mock('../../../src/services/mirroredModel/importers/file.js', () => FileImporterMock)

const ImageImporterMock = vi.hoisted(() => ({
  ImageImporter: vi.fn(function () {
    return {
      mocked: 'file',
    }
  }),
  ImageMirrorMetadata: vi.fn(),
  ImageMirrorInformation: vi.fn(),
}))
vi.mock('../../../src/services/mirroredModel/importers/image.js', () => ImageImporterMock)

vi.mock('./importers/file.js', () => ({
  FileImporter: vi.fn().mockImplementation(function () {
    return {
      mocked: 'file',
    }
  }),
}))

vi.mock('./importers/image.js', () => ({
  ImageImporter: vi.fn().mockImplementation(function () {
    return {
      mocked: 'image',
    }
  }),
}))

let pendingJobs: Promise<any>[] = []
const exportQueueMock = vi.hoisted(() => {
  const exportQueueAddMock = vi.fn(function (job: () => Promise<any>) {
    const p = job()
    pendingJobs.push(p)
    return p
  })
  return {
    add: exportQueueAddMock,
    exportQueueAddMock,
  }
})
vi.mock('p-queue', () => ({
  default: vi.fn(function () {
    return exportQueueMock
  }),
}))

describe('services > mirroredModel', () => {
  beforeEach(() => {
    pendingJobs = []
  })

  const createManifestBody = (layers: any[] = []) => ({
    config: {
      digest: 'sha256:config123',
      size: 1000,
      mediaType: 'application/vnd.docker.container.image.v1+json',
    },
    layers,
    mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
  })

  const createManifestHeaders = () => ({
    'docker-content-digest': 'sha256:manifest123',
    'content-type': 'application/vnd.docker.distribution.manifest.v2+json',
  })

  const mockRegistryManifests = (layers: any[] = []) => {
    const body = createManifestBody(layers)
    registryClientMocks.getImageTagManifests.mockResolvedValueOnce({
      body,
      headers: createManifestHeaders(),
    })
    registryClientMocks.getImageTagManifestsRaw.mockResolvedValueOnce({
      body: JSON.stringify(body),
      headers: createManifestHeaders(),
    })
  }

  describe('exportModel', () => {
    test('disabled export throws', async () => {
      config.ui.modelMirror.export.enabled = false
      await expect(exportModel({} as any, 'modelId', true)).rejects.toThrow(
        BadReq('Exporting models has not been enabled.'),
      )
    })

    test('missing disclaimer throws', async () => {
      config.ui.modelMirror.export.enabled = true
      await expect(exportModel({} as any, 'modelId', false)).rejects.toThrow(
        BadReq('You must agree to the disclaimer agreement before being able to export a model.'),
      )
    })

    test('success triggers queue', async () => {
      config.ui.modelMirror.export.enabled = true
      const id = await exportModel({} as any, 'modelId', true)
      expect(id).toBe('shortId123')
      expect(DocumentsExporterMock).toHaveBeenCalled()
      expect(exportQueueMock.add).toHaveBeenCalled()
    })

    test('success semvers', async () => {
      config.ui.modelMirror.export.enabled = true
      const id = await exportModel({} as any, 'modelId', true, ['1.0.0'])
      expect(id).toBe('shortId123')
      expect(DocumentsExporterMock).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalled()
      expect(exportQueueMock.add).toHaveBeenCalled()
    })

    test('log error on exportQueue reject', async () => {
      config.ui.modelMirror.export.enabled = true
      exportQueueMock.exportQueueAddMock.mockImplementationOnce(() => Promise.reject(new Error('boom')))

      await exportModel({} as any, 'modelId', true)

      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          modelId: 'modelId',
          semvers: undefined,
          mirroredModelId: 'dest123',
          releases: expect.any(Array),
          exportId: 'shortId123',
        }),
        'Error when exporting mirrored model.',
      )
    })
  })

  describe('importModel', () => {
    test('disabled import throws', async () => {
      config.ui.modelMirror.import.enabled = false
      await expect(importModel({} as any, 'url')).rejects.toThrow(BadReq('Importing models has not been enabled.'))
    })

    test('fetch rejects', async () => {
      config.ui.modelMirror.import.enabled = true
      fetchMock.mockRejectedValueOnce('err')
      await expect(importModel({} as any, 'url')).rejects.toThrow(
        InternalError('Unable to get the file.', { err: 'err', payloadUrl: 'url', importId: 'shortId123' }),
      )
    })

    test('non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('bad'),
        body: {} as any,
      })
      await expect(importModel({} as any, 'url')).rejects.toThrow(/Unable to get the file/)
    })

    test('no body', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, body: undefined, text: vi.fn() })
      await expect(importModel({} as any, 'url')).rejects.toThrow(/Unable to get the file/)
    })

    test('success with Readable', async () => {
      const res = await importModel({} as any, 'url')

      expect(fetchMock).toHaveBeenCalled()
      expect(tarballMocks.extractTarGzStream).toHaveBeenCalled()
      expect(getModelByIdMock).toHaveBeenCalledWith('dest123')
      expect(res).toHaveProperty('mirroredModel')
    })

    test('success with ReadableStream', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('web data'))
            controller.close()
          },
        }),
        text: vi.fn(),
      } as any)

      const res = await importModel({} as any, 'url')

      expect(fetchMock).toHaveBeenCalled()
      expect(tarballMocks.extractTarGzStream).toHaveBeenCalled()
      expect(tarballMocks.extractTarGzStream.mock.calls.at(0)?.at(0)).toBeInstanceOf(Readable)
      expect(getModelByIdMock).toHaveBeenCalledWith('dest123')
      expect(res).toHaveProperty('mirroredModel')
    })
  })

  describe('getImporter', () => {
    test('success > Documents', () => {
      const importer = getImporter({ importKind: MirrorKind.Documents } as any, {} as any, {} as any)

      expect(importer).toMatchObject(DocumentsImporterMock.DocumentsImporter())
    })

    test('success > File', () => {
      const importer = getImporter({ importKind: MirrorKind.File } as any, {} as any, {} as any)

      expect(importer).toMatchObject(FileImporterMock.FileImporter())
    })

    test('success > Image', () => {
      const importer = getImporter({ importKind: MirrorKind.Image } as any, {} as any, {} as any)

      expect(importer).toMatchObject(ImageImporterMock.ImageImporter())
    })

    test('fail > invalid importKind', () => {
      expect(() => getImporter({ importKind: 'invalid' } as any, {} as any, {} as any)).toThrow(
        `Unknown \`importKind\` specified in '${config.modelMirror.metadataFile}'.`,
      )
    })
  })

  describe('addCompressedRegistryImageComponents', () => {
    test('no tag throws', async () => {
      registryMocks.splitDistributionPackageName.mockReturnValueOnce({ path: 'img' } as any)
      await expect(
        addCompressedRegistryImageComponents({} as any, 'modelId', 'name', {} as any, {} as any),
      ).rejects.toThrow(/must include a tag/)
    })

    test('export compressed image layers', async () => {
      mockRegistryManifests([{ digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType }])
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['x']), abort: vi.fn() })
      await addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any)
      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalled()
    })

    test('missing digest throws', async () => {
      const emptyBody = {
        config: { digest: '', size: 1, mediaType: '' },
        layers: [],
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      }
      registryClientMocks.getImageTagManifests.mockResolvedValueOnce({
        body: emptyBody,
        headers: createManifestHeaders(),
      })
      registryClientMocks.getImageTagManifestsRaw.mockResolvedValueOnce({
        body: JSON.stringify(emptyBody),
        headers: createManifestHeaders(),
      })
      getImageLayersMock.mockResolvedValueOnce([{ digest: '', size: 1, mediaType: '' }])
      await expect(
        addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any),
      ).rejects.toThrow(/Could not extract layer digest/)
    })

    test('addEntry error aborts', async () => {
      const abortMock = vi.fn()
      mockRegistryManifests([])
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['']), abort: abortMock })
      tarballMocks.addEntryToTarGzUpload
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce('err')
      await expect(
        addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any),
      ).rejects.toThrow('err')
      expect(abortMock).toHaveBeenCalled()
    })
  })

  describe('addAndFinaliseExporters', () => {
    test('success', async () => {
      addAndFinaliseExporters([(await new FileExporterMock().init()) as any], {
        exportId: 'shortId123',
      })

      await Promise.all(pendingJobs)
      expect(FileExporterMock).toHaveBeenCalled()
      const instance = FileExporterMock.mock.results[0].value
      expect(instance.addData).toHaveBeenCalled()
      expect(instance.finalise).toHaveBeenCalled()
      expect(exportQueueMock.add).toHaveBeenCalled()
      expect(logMock.error).not.toHaveBeenCalled()
    })

    test('log error on exportQueue reject', async () => {
      exportQueueMock.exportQueueAddMock.mockImplementationOnce(() => Promise.reject(new Error('boom')))

      addAndFinaliseExporters([(await new FileExporterMock().init()) as any], {
        exportId: 'shortId123',
      })

      await Promise.all(pendingJobs)
      expect(logMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          exportId: 'shortId123',
        }),
        'Error when exporting Object.',
      )
    })
  })

  describe('generateDigest', () => {
    test('success from stream', async () => {
      const input = 'A file with words in.'
      const file = Readable.from(input)

      const expectedDigest = createHash('sha256').update(input).digest('hex')
      const digest = await generateDigest(file)
      expect(digest).toBe(expectedDigest)
    })
    test('pipeline throws', async () => {
      const unreadableFile = new Readable({
        read() {
          this.destroy(new Error())
        },
      })

      await expect(generateDigest(unreadableFile)).rejects.toThrow('Error generating SHA256 digest for stream.')
    })
  })

  describe('exportImageLayers', () => {
    const mockImageLayers = [
      {
        digest: 'sha256:config123',
        size: 1000,
        mediaType: 'application/vnd.docker.container.image.v1+json',
      },
      { digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType },
      { digest: 'sha256:layer2', size: 3000, mediaType: compressedLayerMediaType },
    ]

    test('success all layers added', async () => {
      mockRegistryManifests([{ digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType }])
      getImageLayersMock.mockResolvedValueOnce(mockImageLayers)
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['data']), abort: vi.fn() })

      await addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any)

      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalledTimes(4)
    })

    test('error with tar stream add', async () => {
      const abortMock = vi.fn()
      mockRegistryManifests([{ digest: 'sha256:layer1', size: 2000, mediaType: compressedLayerMediaType }])
      getImageLayersMock.mockResolvedValueOnce(mockImageLayers)
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['data']), abort: abortMock })

      tarballMocks.addEntryToTarGzUpload.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('tar error'))

      await expect(
        addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any),
      ).rejects.toThrow('tar error')
    })

    test('export compressed multi-platform image writes root index and child manifests to tar', async () => {
      const rootDigest = `sha256:${'a'.repeat(64)}`
      const amd64Digest = `sha256:${'b'.repeat(64)}`
      const arm64Digest = `sha256:${'c'.repeat(64)}`
      const rootIndex = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.list.v2+json',
        manifests: [
          {
            mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
            digest: amd64Digest,
            size: 123,
            platform: { os: 'linux', architecture: 'amd64' },
          },
          {
            mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
            digest: arm64Digest,
            size: 456,
            platform: { os: 'linux', architecture: 'arm64' },
          },
        ],
      }
      const amd64Manifest = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { digest: `sha256:${'d'.repeat(64)}`, size: 1, mediaType: 'application/json' },
        layers: [{ digest: `sha256:${'e'.repeat(64)}`, size: 1, mediaType: compressedLayerMediaType }],
      }
      const arm64Manifest = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
        config: { digest: `sha256:${'f'.repeat(64)}`, size: 1, mediaType: 'application/json' },
        layers: [{ digest: `sha256:${'1'.repeat(64)}`, size: 1, mediaType: compressedLayerMediaType }],
      }
      const rootIndexRaw = JSON.stringify(rootIndex)
      const amd64ManifestRaw = JSON.stringify(amd64Manifest)
      const arm64ManifestRaw = JSON.stringify(arm64Manifest)
      registryClientMocks.getImageTagManifests.mockResolvedValueOnce({
        body: rootIndex as any,
        headers: {
          'docker-content-digest': rootDigest,
          'content-type': 'application/vnd.docker.distribution.manifest.list.v2+json',
        },
      })
      registryClientMocks.getImageTagManifestsRaw
        .mockResolvedValueOnce({
          body: rootIndexRaw,
          headers: {
            'docker-content-digest': rootDigest,
            'content-type': 'application/vnd.docker.distribution.manifest.list.v2+json',
          },
        })
        .mockResolvedValueOnce({
          body: amd64ManifestRaw,
          headers: {
            'docker-content-digest': amd64Digest,
            'content-type': 'application/vnd.docker.distribution.manifest.v2+json',
          },
        })
        .mockResolvedValueOnce({
          body: arm64ManifestRaw,
          headers: {
            'docker-content-digest': arm64Digest,
            'content-type': 'application/vnd.docker.distribution.manifest.v2+json',
          },
        })
      getImageLayersMock
        .mockResolvedValueOnce([amd64Manifest.config, ...amd64Manifest.layers])
        .mockResolvedValueOnce([arm64Manifest.config, ...arm64Manifest.layers])
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['layer']), abort: vi.fn() })
      await addCompressedRegistryImageComponents({ dn: 'user-dn' } as any, 'modelId', 'img:tag', {} as any, {} as any)
      expect(registryClientMocks.getImageTagManifestsRaw).toHaveBeenCalledWith('mock-token', {
        repository: 'modelId',
        name: 'img',
        tag: 'tag',
      })
      expect(registryClientMocks.getImageTagManifestsRaw).toHaveBeenCalledWith('mock-token', {
        repository: 'modelId',
        name: 'img',
        digest: amd64Digest,
      })
      expect(registryClientMocks.getImageTagManifestsRaw).toHaveBeenCalledWith('mock-token', {
        repository: 'modelId',
        name: 'img',
        digest: arm64Digest,
      })
      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'text',
          filename: 'manifest.json',
          content: rootIndexRaw,
        }),
        expect.anything(),
      )
      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'text',
          filename: `blobs/manifests/${amd64Digest.replace(/^sha256:/, '')}`,
          content: amd64ManifestRaw,
        }),
        expect.anything(),
      )
      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'text',
          filename: `blobs/manifests/${arm64Digest.replace(/^sha256:/, '')}`,
          content: arm64ManifestRaw,
        }),
        expect.anything(),
      )
    })

    test('export compressed multi-platform image propagates child manifest fetch failures', async () => {
      const rootDigest = `sha256:${'a'.repeat(64)}`
      const amd64Digest = `sha256:${'b'.repeat(64)}`
      const rootIndex = {
        schemaVersion: 2,
        mediaType: 'application/vnd.docker.distribution.manifest.list.v2+json',
        manifests: [
          {
            mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
            digest: amd64Digest,
            size: 123,
            platform: { os: 'linux', architecture: 'amd64' },
          },
        ],
      }
      registryClientMocks.getImageTagManifests.mockResolvedValueOnce({
        body: rootIndex as any,
        headers: {
          'docker-content-digest': rootDigest,
          'content-type': 'application/vnd.docker.distribution.manifest.list.v2+json',
        },
      })
      registryClientMocks.getImageTagManifestsRaw
        .mockResolvedValueOnce({
          body: JSON.stringify(rootIndex),
          headers: {
            'docker-content-digest': rootDigest,
            'content-type': 'application/vnd.docker.distribution.manifest.list.v2+json',
          },
        })
        .mockRejectedValueOnce(new Error('child manifest fetch failed'))
      await expect(
        addCompressedRegistryImageComponents({ dn: 'user-dn' } as any, 'modelId', 'img:tag', {} as any, {} as any),
      ).rejects.toThrow('child manifest fetch failed')
      expect(registryClientMocks.getImageTagManifestsRaw).toHaveBeenCalledWith('mock-token', {
        repository: 'modelId',
        name: 'img',
        digest: amd64Digest,
      })
      expect(registryMocks.getImageBlob).not.toHaveBeenCalled()
    })
  })
})
