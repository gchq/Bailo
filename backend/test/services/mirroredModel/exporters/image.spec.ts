import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReleaseAction } from '../../../../src/connectors/authorisation/actions.js'
import { ImageExporter } from '../../../../src/services/mirroredModel/exporters/image.js'
import { Forbidden, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const mirroredModelMocks = vi.hoisted(() => ({
  addCompressedRegistryImageComponents: vi.fn(),
  MirrorKind: { Image: 'image' },
}))
vi.mock('../../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

const registryMocks = vi.hoisted(() => ({
  joinDistributionPackageName: vi.fn(),
}))
vi.mock('../../../../src/services/registry.js', () => registryMocks)

const authMocks = vi.hoisted(() => ({
  default: {
    model: vi.fn(),
    release: vi.fn(),
    image: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const mockUser = { dn: 'userDN' } as any
const mockModel = {
  id: 'modelId',
  settings: { mirror: { destinationModelId: 'destModelId' } },
  card: { schemaId: 'schemaId' },
} as any
const mockImage = { _id: { toString: () => 'imageId' }, name: 'modelId/image', tag: 'latest' } as any
const mockRelease = { semver: '1.0.0', images: [mockImage] } as any
const mockLogData = { exporterType: 'ImageExporter', exportId: 'exportId' }

describe('services > mirroredModel > exporters > ImageExporter', () => {
  beforeEach(() => {
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    mirroredModelMocks.addCompressedRegistryImageComponents.mockResolvedValue(undefined)
    registryMocks.joinDistributionPackageName.mockReturnValue('joined/name:tag')
    authMocks.default.model.mockResolvedValue({ success: true })
    authMocks.default.release.mockResolvedValue({ success: true })
    authMocks.default.image.mockResolvedValue({ success: true })
  })

  test('constructor sets release and image', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    expect(exporter.getRelease()).toEqual(mockRelease)
    expect(exporter.getImage()).toEqual(mockImage)
  })

  test('init success sets distributionPackageName via _init', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    await exporter.init()

    expect(exporter.getDistributionPackageName()).toBe('joined/name:tag')
    expect(registryMocks.joinDistributionPackageName).toHaveBeenCalled()
  })

  test('_init throws InternalError if image not in release', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, { ...mockRelease, images: [] }, mockImage, mockLogData)
    const expectedErr = InternalError(
      'Could not find image associated with release.\nMethod `ImageExporter._init` failure.',
      {
        modelId: mockModel.id,
        semver: mockRelease.semver,
        imageId: mockImage._id.toString(),
        ...mockLogData,
      },
    )

    // @ts-expect-error calling protected method
    await expect(exporter._init()).rejects.toEqual(expectedErr)
  })

  test('_checkAuths runs successfully when auth passes', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    // @ts-expect-error calling protected method
    await expect(exporter._checkAuths()).resolves.toBeUndefined()

    expect(authMocks.default.release).toHaveBeenCalledWith(mockUser, mockModel, ReleaseAction.View, mockRelease)
    expect(authMocks.default.image).toHaveBeenCalled()
  })

  test('_checkAuths throws Forbidden if release fails', async () => {
    authMocks.default.release.mockResolvedValueOnce({ success: false, info: 'no release access' })
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    const expectedErr = Forbidden('no release access\nMethod `ImageExporter._checkAuths` failure.', {
      userDn: mockUser.dn,
      modelId: mockModel.id,
      semver: mockRelease.semver,
      ...mockLogData,
    })

    // @ts-expect-error calling protected method
    await expect(exporter._checkAuths()).rejects.toEqual(expectedErr)
  })

  test('_checkAuths throws Forbidden if image fails', async () => {
    authMocks.default.image.mockResolvedValueOnce({ success: false, info: 'no image access' })
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    const expectedErr = Forbidden('no image access\nMethod `ImageExporter._checkAuths` failure.', {
      userDn: mockUser.dn,
      modelId: mockModel.id,
      semver: mockRelease.semver,
      imageId: mockImage._id.toString(),
      ...mockLogData,
    })

    // @ts-expect-error calling protected method
    await expect(exporter._checkAuths()).rejects.toEqual(expectedErr)
  })

  test('getInitialiseTarGzUploadParams success returns params', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    exporter['distributionPackageName'] = 'joined/name:tag'

    // @ts-expect-error calling protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe('imageId.tar.gz')
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      distributionPackageName: 'joined/name:tag',
      importKind: mirroredModelMocks.MirrorKind.Image,
    })
    expect(params[2]).toEqual(mockLogData)
  })

  test('getInitialiseTarGzUploadParams throws if model missing', () => {
    const exporter = new ImageExporter(mockUser, undefined as any, mockRelease, mockImage, mockLogData)
    exporter['distributionPackageName'] = 'joined/name:tag'
    const expectedErr = InternalError(
      'Method `getInitialiseTarGzUploadParams` called before `this.model` defined.\nMethod `ImageExporter.getInitialiseTarGzUploadParams` failure.',
      mockLogData,
    )

    // @ts-expect-error calling protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(expectedErr)
  })

  test('getInitialiseTarGzUploadParams throws if distributionPackageName missing', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    const expectedErr = InternalError(
      'Method `getInitialiseTarGzUploadParams` called before `this.distributionPackageName` defined.\nMethod `ImageExporter.getInitialiseTarGzUploadParams` failure.',
      mockLogData,
    )

    // @ts-expect-error calling protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(expectedErr)
  })

  test('_addData calls addCompressedRegistryImageComponents', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    exporter['distributionPackageName'] = 'joined/name:tag'
    exporter['tarStream'] = {} as any

    // @ts-expect-error calling protected method
    await exporter._addData()

    expect(mirroredModelMocks.addCompressedRegistryImageComponents).toHaveBeenCalledWith(
      mockUser,
      mockModel.id,
      'joined/name:tag',
      exporter['tarStream'],
      mockLogData,
    )
  })
})
