import { PassThrough, Readable } from 'node:stream'

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
import { BadReq, InternalError } from '../../../src/utils/error.js'

const configMock = vi.hoisted(() => ({
  ui: {
    modelMirror: {
      import: { enabled: true },
      export: { enabled: true },
    },
  },
  connectors: {
    authentication: {
      kind: 'silly',
    },
    audit: {
      kind: 'silly',
    },
    authorisation: {
      kind: 'basic',
    },
    fileScanners: {
      kinds: [],
    },
  },
  app: {
    protocol: '',
  },
  modelMirror: { export: { concurrency: 1 }, metadataFile: 'meta.json' },
}))
vi.mock('../../../src/utils/config.js', () => ({ default: configMock }))

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
    vi.clearAllMocks()
  })

  describe('exportModel', () => {
    test('disabled export throws', async () => {
      configMock.ui.modelMirror.export.enabled = false
      await expect(exportModel({} as any, 'modelId', true)).rejects.toThrow(
        BadReq('Exporting models has not been enabled.'),
      )
    })

    test('missing disclaimer throws', async () => {
      configMock.ui.modelMirror.export.enabled = true
      await expect(exportModel({} as any, 'modelId', false)).rejects.toThrow(
        BadReq('You must agree to the disclaimer agreement before being able to export a model.'),
      )
    })

    test('success triggers queue', async () => {
      configMock.ui.modelMirror.export.enabled = true
      const id = await exportModel({} as any, 'modelId', true)
      expect(id).toBe('shortId123')
      expect(DocumentsExporterMock).toHaveBeenCalled()
      expect(exportQueueMock.add).toHaveBeenCalled()
    })

    test('success semvers', async () => {
      configMock.ui.modelMirror.export.enabled = true
      const id = await exportModel({} as any, 'modelId', true, ['1.0.0'])
      expect(id).toBe('shortId123')
      expect(DocumentsExporterMock).toHaveBeenCalled()
      expect(releaseMocks.getReleasesForExport).toHaveBeenCalled()
      expect(exportQueueMock.add).toHaveBeenCalled()
    })

    test('log error on exportQueue reject', async () => {
      configMock.ui.modelMirror.export.enabled = true
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
      configMock.ui.modelMirror.import.enabled = false
      await expect(importModel({} as any, 'url')).rejects.toThrow(BadReq('Importing models has not been enabled.'))
    })

    test('fetch rejects', async () => {
      configMock.ui.modelMirror.import.enabled = true
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
      expect(() => getImporter({ importKind: 'invalid' } as any, {} as any, {} as any)).toThrowError(
        `Unknown \`importKind\` specified in '${configMock.modelMirror.metadataFile}'.`,
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
      registryMocks.getImageManifest.mockResolvedValue({
        body: {
          config: { digest: 'sha256:0', size: 1, mediaType: 'text/json' },
          layers: [{ digest: 'sha256:1', size: 1, mediaType: 'text/json' }],
          mediaType: 'manifest',
        },
      })
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['x']), abort: vi.fn() })
      await addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any)
      expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalled()
    })

    test('missing digest throws', async () => {
      registryMocks.getImageManifest.mockResolvedValue({
        body: {
          config: { digest: '', size: 1, mediaType: '' },
          layers: [],
          mediaType: 'm',
        },
      })
      await expect(
        addCompressedRegistryImageComponents({} as any, 'modelId', 'img:tag', {} as any, {} as any),
      ).rejects.toThrow(/Could not extract layer digest/)
    })

    test('addEntry error aborts', async () => {
      const abortMock = vi.fn()
      registryMocks.getImageManifest.mockResolvedValue({
        body: {
          config: { digest: 'sha256:0', size: 1, mediaType: '' },
          layers: [],
          mediaType: 'm',
        },
      })
      registryMocks.getImageBlob.mockResolvedValue({ stream: Readable.from(['']), abort: abortMock })
      tarballMocks.addEntryToTarGzUpload.mockResolvedValueOnce({}).mockRejectedValueOnce('err')
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
      const stream = new PassThrough()
      setImmediate(() => {
        stream.write('abc')
        stream.end()
      })
      const digest = await generateDigest(stream)
      expect(digest).toMatch(/^[a-f0-9]{64}$/)
    })
    test('pipe throws', async () => {
      await expect(
        generateDigest({
          pipe: () => {
            throw new Error('fail')
          },
        } as any),
      ).rejects.toThrow(/Error generating SHA256/)
    })
    test('error event', async () => {
      const stream = new PassThrough()
      setImmediate(() => {
        stream.emit('error', new Error('err'))
      })
      await expect(generateDigest(stream)).rejects.toThrow(/Error generating SHA256/)
    })
  })
})
