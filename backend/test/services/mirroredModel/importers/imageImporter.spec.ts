import { PassThrough } from 'stream'
import { Headers } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ImageImporter } from '../../../../src/services/mirroredModel/importers/imageImporter.js'
import { ImageExportMetadata, ImportKind } from '../../../../src/services/mirroredModel/mirroredModel.js'

vi.mock('../../../../src/services/model.js', () => ({}))
vi.mock('../../../../src/connectors/fileScanning/index.js', () => ({}))
vi.mock('../../../../src/services/accessRequest.js', () => ({}))
vi.mock('../../../../src/services/review.js', () => ({}))
vi.mock('../../../../src/services/release.js', () => ({}))
vi.mock('../../../../src/services/mirroredModel/tarball.ts', () => ({}))

const configMocks = vi.hoisted(() => ({
  modelMirror: {
    contentDirectory: 'content-dir',
  },
}))
vi.mock('../../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMocks,
}))

const authMocks = vi.hoisted(() => ({
  default: {
    releases: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const registryMocks = vi.hoisted(() => ({
  splitDistributionPackageName: vi.fn(() => ({ path: 'imageName', tag: 'tag' })),
  doesImageLayerExist: vi.fn(),
  initialiseImageUpload: vi.fn(() => ({ location: 'upload-location' })),
  putImageBlob: vi.fn(),
  putImageManifest: vi.fn(),
}))
vi.mock('../../../../src/services/registry.js', () => registryMocks)

const logMocks = vi.hoisted(() => ({
  debug: vi.fn(),
  warn: vi.fn(),
}))
vi.mock('../../../../src/services/log.js', () => ({
  default: logMocks,
}))

const typeguardMocks = vi.hoisted(() => ({
  hasKeysOfType: vi.fn(),
}))
vi.mock('../../../../src/utils/typeguards.js', () => typeguardMocks)

const streamConsumersMocks = vi.hoisted(() => ({
  json: vi.fn(),
}))
vi.mock('node:stream/consumers', () => streamConsumersMocks)

vi.mock('stream/promises', () => ({
  finished: vi.fn(() => Promise.resolve()),
}))

const mockUser = { dn: 'user' }
const mockMetadata: ImageExportMetadata = {
  importKind: ImportKind.Image,
  mirroredModelId: 'model1',
  distributionPackageName: 'domain/imageName:tag',
} as ImageExportMetadata

describe('services > mirroredModel > importers > ImageImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('constructor > success', () => {
    const importer = new ImageImporter(mockUser, mockMetadata)
    expect(importer.user).toBe(mockUser)
    expect(importer.imageName).toBe('imageName')
    expect(importer.imageTag).toBe('tag')
  })

  test('constructor > error when importKind is not Image', () => {
    const badMetadata = { ...mockMetadata, importKind: 'OtherKind' } as any
    expect(() => new ImageImporter(mockUser, badMetadata)).toThrowError(
      /^Cannot parse compressed Image: incorrect metadata specified\./,
    )
  })

  test('constructor > error when splitDistributionPackageName result has no tag', () => {
    registryMocks.splitDistributionPackageName.mockReturnValueOnce({ path: 'imageName' } as any)
    expect(() => new ImageImporter(mockUser, mockMetadata)).toThrowError(
      /^Distribution Package Name must include a tag\./,
    )
  })

  test('processEntry > success extract manifest.json', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = { name: 'content-dir/manifest.json', type: 'file' } as Headers
    const stream = new PassThrough()
    streamConsumersMocks.json.mockResolvedValue({ manifest: true })

    await importer.processEntry(entry, stream)

    expect(streamConsumersMocks.json).toHaveBeenCalledWith(stream)
    expect(importer.manifestBody).toEqual({ manifest: true })
  })

  test('processEntry > success skips blob if it exists in registry', async () => {
    registryMocks.doesImageLayerExist.mockResolvedValue(true)
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'a'.repeat(64),
      type: 'file',
      size: 10,
    } as Headers
    const stream = new PassThrough()
    const resumeSpy = vi.spyOn(stream, 'resume')

    await importer.processEntry(entry, stream)

    expect(resumeSpy).toHaveBeenCalled()
    expect(registryMocks.initialiseImageUpload).not.toHaveBeenCalled()
  })

  test('processEntry > success uploads blob if not in registry', async () => {
    registryMocks.doesImageLayerExist.mockResolvedValue(false)
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'b'.repeat(64),
      type: 'file',
      size: 20,
    } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(registryMocks.initialiseImageUpload).toHaveBeenCalled()
    expect(registryMocks.putImageBlob).toHaveBeenCalledWith(
      mockUser,
      mockMetadata.mirroredModelId,
      'imageName',
      'upload-location',
      expect.stringContaining('sha256:'),
      stream,
      String(entry.size),
    )
  })

  test('processEntry > error when blob upload fails', async () => {
    registryMocks.doesImageLayerExist.mockResolvedValue(false)
    registryMocks.initialiseImageUpload.mockImplementation(() => {
      throw new Error('init fail')
    })
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'c'.repeat(64),
      type: 'file',
      size: 30,
    } as Headers
    const stream = new PassThrough()

    await expect(importer.processEntry(entry, stream)).rejects.toThrowError(/^Failed to upload blob to registry\./)
  })

  test('processEntry > error for unrecognised file path', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = { name: 'content-dir/invalid.json', type: 'file' } as Headers
    const stream = new PassThrough()

    await expect(importer.processEntry(entry, stream)).rejects.toThrowError(
      /^Cannot parse compressed image: unrecognised contents\./,
    )
  })

  test('processEntry > success warns & skips non-file entries', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata)
    const entry: Headers = { name: 'some-dir', type: 'directory' } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(logMocks.warn).toHaveBeenCalledWith({ name: 'some-dir', type: 'directory' }, 'Skipping non-file entry.')
  })

  test('finishListener > success upload manifest successfully when valid', async () => {
    typeguardMocks.hasKeysOfType.mockReturnValue(true)
    const importer = new ImageImporter(mockUser, mockMetadata)
    importer.manifestBody = { mediaType: 'mt' }
    const resolve = vi.fn()
    const reject = vi.fn()

    await importer.finishListener(resolve, reject)

    expect(registryMocks.putImageManifest).toHaveBeenCalledWith(
      mockUser,
      mockMetadata.mirroredModelId,
      'imageName',
      'tag',
      JSON.stringify(importer.manifestBody),
      'mt',
    )
    expect(resolve).toHaveBeenCalledWith({
      metadata: mockMetadata,
      image: { modelId: mockMetadata.mirroredModelId, imageName: 'imageName', imageTag: 'tag' },
    })
  })

  test('finishListener > error when manifest invalid', async () => {
    typeguardMocks.hasKeysOfType.mockReturnValue(false)
    const importer = new ImageImporter(mockUser, mockMetadata)
    importer.manifestBody = { bad: 'data' }
    const resolve = vi.fn()
    const reject = vi.fn()

    await importer.finishListener(resolve, reject)

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/^Manifest file \(manifest\.json\) missing or invalid/),
      }),
    )
  })
})
