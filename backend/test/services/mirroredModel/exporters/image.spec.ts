import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReleaseAction } from '../../../../src/connectors/authorisation/actions.js'
import { ImageExporter } from '../../../../src/services/mirroredModel/exporters/image.js'
import { MirrorKind } from '../../../../src/services/mirroredModel/index.js'
import { Forbidden, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const mirroredModelMocks = vi.hoisted(() => ({
  addCompressedRegistryImageComponents: vi.fn(),
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

describe('connectors > mirroredModel > exporters > ImageExporter', () => {
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

  test('constructor > sets release, image and logData', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    expect(exporter.getRelease()).toEqual(mockRelease)
    expect(exporter.getImage()).toEqual(mockImage)
    expect(exporter).toMatchSnapshot()
  })

  test('_init > success sets distributionPackageName', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    // @ts-expect-error protected method
    await exporter._init()

    expect(authMocks.default.release).toHaveBeenCalledWith(mockUser, mockModel, ReleaseAction.View, mockRelease)
    expect(authMocks.default.image).toHaveBeenCalled()
    expect(exporter.getDistributionPackageName()).toBe('joined/name:tag')
  })

  test('_init > throws Forbidden if release auth fails', async () => {
    authMocks.default.release.mockResolvedValueOnce({ success: false, info: 'no release access' })
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      Forbidden('no release access', {
        userDn: mockUser.dn,
        modelId: mockModel.id,
        semver: mockRelease.semver,
        ...mockLogData,
      }),
    )
  })

  test('_init > throws InternalError if image not in release', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, { ...mockRelease, images: [] }, mockImage, mockLogData)

    await expect(
      // @ts-expect-error protected method
      exporter._init(),
    ).rejects.toEqual(
      InternalError('Could not find image associated with release.', {
        modelId: mockModel.id,
        semver: mockRelease.semver,
        imageId: mockImage._id.toString(),
        ...mockLogData,
      }),
    )
  })

  test('_init > throws Forbidden if image auth fails', async () => {
    authMocks.default.image.mockResolvedValueOnce({ success: false, info: 'no image access' })
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      Forbidden('no image access', {
        userDn: mockUser.dn,
        modelId: mockModel.id,
        semver: mockRelease.semver,
        imageId: mockImage._id.toString(),
        ...mockLogData,
      }),
    )
  })

  test('getInitialiseTarGzUploadParams > returns correct params', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    exporter['distributionPackageName'] = 'joined/name:tag'

    // @ts-expect-error protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe(`${mockImage._id.toString()}.tar.gz`)
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      distributionPackageName: 'joined/name:tag',
      importKind: MirrorKind.Image,
    })
    expect(params[2]).toEqual(mockLogData)
  })

  test('getInitialiseTarGzUploadParams > throws if model missing', () => {
    const exporter = new ImageExporter(mockUser, undefined as any, mockRelease, mockImage, mockLogData)
    exporter['distributionPackageName'] = 'joined/name:tag'

    // @ts-expect-error protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(
      InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', mockLogData),
    )
  })

  test('getInitialiseTarGzUploadParams > throws if distributionPackageName missing', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    // @ts-expect-error protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(
      InternalError(
        'Method `getInitialiseTarGzUploadParams` called before `this.distributionPackageName` defined.',
        mockLogData,
      ),
    )
  })

  test('addData > throws if not initialised', () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)

    expect(() => exporter.addData()).toThrowError(
      InternalError('Method `ImageExporter.addData` called before `init()`.', mockLogData),
    )
  })

  test('addData > success calls addCompressedRegistryImageComponents', async () => {
    const exporter = new ImageExporter(mockUser, mockModel, mockRelease, mockImage, mockLogData)
    exporter['initialised'] = true
    exporter['distributionPackageName'] = 'joined/name:tag'
    exporter['tarStream'] = {} as any
    exporter['gzipStream'] = {} as any
    exporter['uploadStream'] = {} as any
    exporter['uploadPromise'] = Promise.resolve()

    await exporter.addData()

    expect(mirroredModelMocks.addCompressedRegistryImageComponents).toHaveBeenCalledWith(
      mockUser,
      mockModel.id,
      'joined/name:tag',
      exporter['tarStream'],
      mockLogData,
    )
  })
})
