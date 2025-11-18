import { PassThrough } from 'node:stream'

import { Headers } from 'tar-stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ImageImporter, ImageMirrorMetadata } from '../../../../src/services/mirroredModel/importers/image.js'

const authMocks = vi.hoisted(() => ({
  default: {
    releases: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const registryServiceMocks = vi.hoisted(() => ({
  splitDistributionPackageName: vi.fn(() => ({ path: 'imageName', tag: 'tag' })),
}))
vi.mock('../../../../src/services/registry.js', () => registryServiceMocks)

const registryClientMocks = vi.hoisted(() => ({
  doesLayerExist: vi.fn(),
  initialiseUpload: vi.fn(() => ({ location: 'upload-location' })),
  uploadLayerMonolithic: vi.fn(),
  putManifest: vi.fn(),
}))
vi.mock('../../../../src/clients/registry.js', () => registryClientMocks)

const registryAuthMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../../../src/routes/v1/registryAuth.js', () => registryAuthMocks)

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

const mirroredModelMocks = vi.hoisted(() => ({
  MirrorKind: { Image: 'image' },
}))
vi.mock('../../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

const mockUser = { dn: 'user' }
const mockMetadata: ImageMirrorMetadata = {
  importKind: mirroredModelMocks.MirrorKind.Image,
  mirroredModelId: 'model1',
  distributionPackageName: 'domain/imageName:tag',
} as ImageMirrorMetadata
const mockLogData = { extra: 'info', importId: 'importId' }

describe('connectors > mirroredModel > importers > ImageImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('constructor > success', () => {
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    expect(importer).toMatchSnapshot()
  })

  test('constructor > error when importKind is not Image', () => {
    const badMetadata = { ...mockMetadata, importKind: 'OtherKind' } as any
    expect(() => new ImageImporter(mockUser, badMetadata, mockLogData)).toThrowError(
      /^Cannot parse compressed Image: incorrect metadata specified\./,
    )
  })

  test('constructor > error when splitDistributionPackageName result has no tag', () => {
    registryServiceMocks.splitDistributionPackageName.mockReturnValueOnce({ path: 'imageName' } as any)
    expect(() => new ImageImporter(mockUser, mockMetadata, mockLogData)).toThrowError(
      /^Distribution Package Name must include a tag\./,
    )
  })

  test('processEntry > success extract manifest.json', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = { name: 'content-dir/manifest.json', type: 'file' } as Headers
    const stream = new PassThrough()
    streamConsumersMocks.json.mockResolvedValue({ manifest: true })

    await importer.processEntry(entry, stream)

    expect(streamConsumersMocks.json).toHaveBeenCalledWith(stream)
    expect(importer).toMatchSnapshot()
  })

  test('processEntry > success skips blob if it exists in registry', async () => {
    registryClientMocks.doesLayerExist.mockResolvedValue(true)
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'a'.repeat(64),
      type: 'file',
      size: 10,
    } as Headers
    const stream = new PassThrough()
    const resumeSpy = vi.spyOn(stream, 'resume')

    await importer.processEntry(entry, stream)

    expect(resumeSpy).toHaveBeenCalled()
    expect(registryClientMocks.initialiseUpload).not.toHaveBeenCalled()
  })

  test('processEntry > success uploads blob if not in registry', async () => {
    registryClientMocks.doesLayerExist.mockResolvedValue(false)
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'b'.repeat(64),
      type: 'file',
      size: 20,
    } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(registryClientMocks.initialiseUpload).toHaveBeenCalled()
    expect(registryClientMocks.uploadLayerMonolithic).toHaveBeenCalledWith(
      undefined,
      'upload-location',
      expect.stringContaining('sha256:'),
      stream,
      String(entry.size),
    )
  })

  test('processEntry > error when blob upload fails', async () => {
    registryClientMocks.doesLayerExist.mockResolvedValue(false)
    registryClientMocks.initialiseUpload.mockImplementation(() => {
      throw new Error('init fail')
    })
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = {
      name: 'content-dir/blobs/sha256/' + 'c'.repeat(64),
      type: 'file',
      size: 30,
    } as Headers
    const stream = new PassThrough()

    await expect(importer.processEntry(entry, stream)).rejects.toThrowError(/^Failed to upload blob to registry\./)
  })

  test('processEntry > error for unrecognised file path', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = { name: 'content-dir/invalid.json', type: 'file' } as Headers
    const stream = new PassThrough()

    await expect(importer.processEntry(entry, stream)).rejects.toThrowError(
      /^Cannot parse compressed image: unrecognised contents\./,
    )
  })

  test('processEntry > success warns & skips non-file entries', async () => {
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    const entry: Headers = { name: 'some-dir', type: 'directory' } as Headers
    const stream = new PassThrough()

    await importer.processEntry(entry, stream)

    expect(logMocks.warn).toHaveBeenCalledWith(
      { name: 'some-dir', type: 'directory', importerType: 'ImageImporter', ...mockLogData },
      'Skipping non-file entry.',
    )
  })

  test('finishListener > success upload manifest successfully when valid', async () => {
    typeguardMocks.hasKeysOfType.mockReturnValue(true)
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
    // @ts-expect-error accessing protected property
    importer.manifestBody = { mediaType: 'mt' }
    const resolve = vi.fn()
    const reject = vi.fn()

    await importer.finishListener(resolve, reject)

    expect(registryClientMocks.putManifest).toHaveBeenCalledWith(
      undefined,
      { repository: mockMetadata.mirroredModelId, name: 'imageName', tag: 'tag' },
      // @ts-expect-error accessing protected property
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
    const importer = new ImageImporter(mockUser, mockMetadata, mockLogData)
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
