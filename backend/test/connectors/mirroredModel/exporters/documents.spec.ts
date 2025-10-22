import { PassThrough } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ScanState } from '../../../../src/connectors/fileScanning/Base.js'
import { DocumentsExporter } from '../../../../src/connectors/mirroredModel/exporters/documents.js'
import { MirrorKind } from '../../../../src/connectors/mirroredModel/index.js'
import { BadReq, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
  addEntryToTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const fileServiceMocks = vi.hoisted(() => ({
  getFilesByIds: vi.fn(),
  getTotalFileSize: vi.fn(),
}))
vi.mock('../../../../src/services/file.js', () => fileServiceMocks)

const modelServiceMocks = vi.hoisted(() => ({
  getModelCardRevisions: vi.fn(),
}))
vi.mock('../../../../src/services/model.js', () => modelServiceMocks)

const releaseServiceMocks = vi.hoisted(() => ({
  getAllFileIds: vi.fn(),
}))
vi.mock('../../../../src/services/release.js', () => releaseServiceMocks)

const logMocks = vi.hoisted(() => ({
  default: {
    debug: vi.fn(),
  },
}))
vi.mock('../../../../src/services/log.js', () => logMocks)

const scannersMocks = vi.hoisted(() => ({
  default: {
    info: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/fileScanning/index.js', () => scannersMocks)

const configMocks = vi.hoisted(() => ({
  default: {
    modelMirror: {
      export: {
        maxSize: 1000,
      },
    },
  },
}))
vi.mock('../../../../src/utils/config.js', () => configMocks)

const authMocks = vi.hoisted(() => ({
  default: {
    model: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const mockUser = { dn: 'userDN' } as any
const mockModel = {
  id: 'modelId',
  settings: { mirror: { destinationModelId: 'destModelId' } },
  card: { schemaId: 'schemaId' },
} as any

const mockRelease = {
  id: 'relId',
  semver: '1.0.0',
  modelId: 'modelId',
  fileIds: ['f1'],
  toJSON: () => ({ foo: 'bar' }),
} as any

const mockFile = {
  id: 'fileId',
  _id: { toString: () => 'fileId' },
  name: 'f',
  avScan: [{ state: ScanState.Complete, isInfected: false }],
} as any

describe('connectors > mirroredModel > exporters > DocumentsExporter', () => {
  beforeEach(() => {
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    tarballMocks.addEntryToTarGzUpload.mockResolvedValue(undefined)
    fileServiceMocks.getFilesByIds.mockResolvedValue([mockFile])
    fileServiceMocks.getTotalFileSize.mockResolvedValue(500)
    modelServiceMocks.getModelCardRevisions.mockResolvedValue([{ version: 'v1', toJSON: () => ({}) }])
    releaseServiceMocks.getAllFileIds.mockResolvedValue(['fileId'])
    scannersMocks.default.info.mockReturnValue(false)
    authMocks.default.model.mockResolvedValue({ success: true })
  })

  test('constructor > sets releases and logData', () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])

    expect(exporter.getReleases()).toEqual([mockRelease])
    expect(exporter).toMatchSnapshot()
  })

  test('_init > success without releases', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel)

    // @ts-expect-error protected method
    await exporter._init()

    expect(authMocks.default.model).toHaveBeenCalled()
  })

  test('_init > success with releases calls checkReleaseFiles', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])

    // @ts-expect-error protected method
    await exporter._init()

    expect(exporter.getFiles()).toEqual([mockFile])
  })

  test('checkReleaseFiles > returns early when multiple releases have no fileIds', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease, mockRelease])
    releaseServiceMocks.getAllFileIds.mockResolvedValueOnce([])

    await expect(
      // @ts-expect-error protected
      exporter.checkReleaseFiles(),
    ).resolves.toBeUndefined()
    expect(fileServiceMocks.getFilesByIds).toHaveBeenCalled()
    expect(fileServiceMocks.getTotalFileSize).not.toHaveBeenCalled()
  })

  test('checkReleaseFiles > throws BadReq if total size exceeds max', async () => {
    fileServiceMocks.getTotalFileSize.mockResolvedValueOnce(2000)
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease, mockRelease])

    await expect(
      // @ts-expect-error protected method
      exporter.checkReleaseFiles(),
    ).rejects.toEqual(
      BadReq('Requested export is too large.', { size: 2000, maxSize: configMocks.default.modelMirror.export.maxSize }),
    )
  })

  test('checkReleaseFiles > throws BadReq if AV scan issues', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const badFile = { id: 'f', name: 'name', avScan: [] }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([badFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])

    await expect(
      // @ts-expect-error protected method
      exporter.checkReleaseFiles(),
    ).rejects.toEqual(
      BadReq('The releases contain file(s) that do not have a clean AV scan.', {
        scanErrors: expect.any(Object),
      }),
    )
  })

  test('checkReleaseFiles > throws BadReq when AV scan incomplete', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const incompleteFile = { id: 'f', name: 'name', avScan: [{ state: ScanState.InProgress, isInfected: false }] }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([incompleteFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])

    await expect(
      // @ts-expect-error protected
      exporter.checkReleaseFiles(),
    ).rejects.toEqual(
      BadReq('The releases contain file(s) that do not have a clean AV scan.', {
        scanErrors: expect.any(Object),
      }),
    )
  })

  test('checkReleaseFiles > throws BadReq when AV scan failed', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const infectedFile = { id: 'f', name: 'name', avScan: [{ state: ScanState.Complete, isInfected: true }] }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([infectedFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])

    await expect(
      // @ts-expect-error protected
      exporter.checkReleaseFiles(),
    ).rejects.toEqual(
      BadReq('The releases contain file(s) that do not have a clean AV scan.', {
        scanErrors: expect.any(Object),
      }),
    )
  })

  test('getInitialiseTarGzUploadParams > returns correct params', () => {
    const exporter = new DocumentsExporter(mockUser, mockModel)

    // @ts-expect-error protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe(`${mockModel.id}.tar.gz`)
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      importKind: MirrorKind.Documents,
    })
  })

  test('getInitialiseTarGzUploadParams > throws if model missing', () => {
    const exporter = new DocumentsExporter(mockUser, undefined as any)

    // @ts-expect-error protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(
      InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        exporterType: 'DocumentsExporter',
      }),
    )
  })

  test('addData > throws if not initialised', () => {
    const exporter = new DocumentsExporter(mockUser, mockModel)

    expect(() => exporter.addData()).toThrowError(
      InternalError('Method `DocumentsExporter.addData` called before `init()`.', {
        exporterType: 'DocumentsExporter',
      }),
    )
  })

  test('addData > success calls addModelCardRevisionsToTarball and addReleasesToTarball', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    await exporter.addData()

    expect(modelServiceMocks.getModelCardRevisions).toHaveBeenCalled()
    expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalled()
  })

  test('addData > wraps error from addModelCardRevisionsToTarball with InternalError message', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    await expect(exporter.addData()).rejects.toThrow(
      'Error when adding the model card revision(s) to the Tarball file.',
    )
  })

  test('addData > wraps error from addReleasesToTarball with InternalError message', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()
    const spy = vi.spyOn(exporter as any, 'addReleasesToTarball').mockImplementationOnce(() => {
      throw new Error('fail')
    })

    await expect(exporter.addData()).rejects.toThrow('Error when adding the release(s) to the Tarball file.')

    spy.mockRestore()
  })

  test('addModelCardRevisionsToTarball > propagates error from addEntryToTarGzUpload', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    await expect(
      // @ts-expect-error protected method
      exporter.addModelCardRevisionsToTarball(),
    ).rejects.toThrow('fail')
  })

  test('addReleasesToTarball > throws InternalError if release fails', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()
    const errExporter = vi.spyOn(exporter as any, 'addReleaseToTarball')
    errExporter.mockRejectedValueOnce(new Error('fail'))

    await expect(
      // @ts-expect-error protected method
      exporter.addReleasesToTarball(),
    ).rejects.toThrow('Error when adding release(s) to Tarball file.')
  })

  test('addReleaseToTarball > throws InternalError if entry fails', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease])
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    await expect(
      // @ts-expect-error protected method
      exporter.addReleaseToTarball(mockRelease),
    ).rejects.toThrow('Error when generating the tarball file.')
  })

  test('addFilesToTarball > throws InternalError if entry fails', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    await expect(
      // @ts-expect-error protected method
      exporter.addFilesToTarball([mockFile]),
    ).rejects.toThrow('Error when generating the tarball file.')
  })
})
