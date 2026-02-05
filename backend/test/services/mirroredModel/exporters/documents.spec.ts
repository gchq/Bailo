import { PassThrough } from 'node:stream'

import { SeverityLevel } from 'mongodb'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ArtefactScanState } from '../../../../src/connectors/artefactScanning/Base.js'
import { DocumentsExporter } from '../../../../src/services/mirroredModel/exporters/documents.js'
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
  default: { trace: vi.fn(), debug: vi.fn() },
}))
vi.mock('../../../../src/services/log.js', () => logMocks)

const scannersMocks = vi.hoisted(() => ({
  default: { scannersInfo: vi.fn() },
}))
vi.mock('../../../../src/connectors/artefactScanning/index.js', () => scannersMocks)

const configMocks = vi.hoisted(() => ({
  default: { modelMirror: { export: { maxSize: 1000 } } },
}))
vi.mock('../../../../src/utils/config.js', () => configMocks)

const authMocks = vi.hoisted(() => ({
  default: { model: vi.fn() },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

const mirroredModelMocks = vi.hoisted(() => ({
  MirrorKind: { Documents: 'documents' },
}))
vi.mock('../../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

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
  scanResults: [{ state: ArtefactScanState.Complete }],
} as any

const mockLogData = { extra: 'info', exportId: 'exportId', exporterType: 'DocumentsExporter' }

describe('services > mirroredModel > exporters > DocumentsExporter', () => {
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
    scannersMocks.default.scannersInfo.mockReturnValue(false)
    authMocks.default.model.mockResolvedValue({ success: true })
  })

  test('constructor sets releases array', () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)

    expect(exporter.getReleases()).toEqual([mockRelease])
  })

  test('_init succeeds with no releases', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)

    // @ts-expect-error calling protected method
    await expect(exporter._init()).resolves.toBeUndefined()
  })

  test('_init success with releases populates files', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)

    // @ts-expect-error calling protected method
    await exporter._init()

    expect(exporter.getFiles()).toEqual([mockFile])
  })

  test('_init with multiple releases and no fileIds returns early', async () => {
    releaseServiceMocks.getAllFileIds.mockResolvedValueOnce([])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease, mockRelease], mockLogData)

    // @ts-expect-error calling protected method
    await exporter._init()

    expect(fileServiceMocks.getTotalFileSize).not.toHaveBeenCalled()
  })

  test('_init throws BadReq when total size exceeds max', async () => {
    fileServiceMocks.getTotalFileSize.mockResolvedValueOnce(2000)
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease, mockRelease], mockLogData)
    const expectedErr = BadReq('Requested export is too large.\nMethod `DocumentsExporter._init` failure.', {
      size: 2000,
      maxSize: configMocks.default.modelMirror.export.maxSize,
    })

    // @ts-expect-error calling protected method
    await expect(exporter._init()).rejects.toEqual(expectedErr)
  })

  test('_init throws BadReq if scan issues (missing scan)', async () => {
    scannersMocks.default.scannersInfo.mockReturnValue(true)
    const badFile = { id: 'f', name: 'name', scanResults: [] }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([badFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    const expectedErr = BadReq(
      'The releases contain file(s) that do not have a clean scan.\nMethod `DocumentsExporter._init` failure.',
      { scanErrors: expect.any(Object) },
    )

    // @ts-expect-error calling protected method
    await expect(exporter._init()).rejects.toEqual(expectedErr)
  })

  test('_init throws BadReq if scan incomplete', async () => {
    scannersMocks.default.scannersInfo.mockReturnValue(true)
    const incompleteFile = {
      id: 'f',
      name: 'name',
      scanResults: [{ state: ArtefactScanState.InProgress }],
    }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([incompleteFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    const expectedErr = BadReq(
      'The releases contain file(s) that do not have a clean scan.\nMethod `DocumentsExporter._init` failure.',
      { scanErrors: expect.any(Object) },
    )

    // @ts-expect-error calling protected method
    await expect(exporter._init()).rejects.toEqual(expectedErr)
  })

  test('_init throws BadReq if scan failed', async () => {
    scannersMocks.default.scannersInfo.mockReturnValue(true)
    const infectedFile = {
      id: 'f',
      name: 'name',
      scanResults: [
        {
          state: ArtefactScanState.Complete,
          summary: [{ severity: SeverityLevel.CRITICAL, vulnerabilityDescription: 'There is a virus aboard' }],
        },
      ],
    }
    fileServiceMocks.getFilesByIds.mockResolvedValueOnce([infectedFile as any])
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    const expectedErr = BadReq(
      'The releases contain file(s) that do not have a clean scan.\nMethod `DocumentsExporter._init` failure.',
      { scanErrors: expect.any(Object) },
    )

    // @ts-expect-error calling protected method
    await expect(exporter._init()).rejects.toEqual(expectedErr)
  })

  test('getInitialiseTarGzUploadParams returns correct params', () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)

    // @ts-expect-error calling protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe(`${mockModel.id}.tar.gz`)
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      importKind: mirroredModelMocks.MirrorKind.Documents,
    })
  })

  test('getInitialiseTarGzUploadParams throws if model missing', () => {
    const exporter = new DocumentsExporter(mockUser, undefined as any, [], mockLogData)

    // @ts-expect-error calling protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrow()
  })

  test('_addData throws if not initialised', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)
    const expectedErr = InternalError(
      'Method `DocumentsExporter._addData` called before `init()`.\nMethod `DocumentsExporter._addData` failure.',
      mockLogData,
    )

    // @ts-expect-error calling protected method
    await expect(exporter._addData()).rejects.toEqual(expectedErr)
  })

  test('_addData success runs both model cards and releases', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    // @ts-expect-error calling protected method
    await exporter._addData()

    expect(modelServiceMocks.getModelCardRevisions).toHaveBeenCalled()
    expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalled()
  })

  test('_addData wraps error from addModelCardRevisionsToTarball', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    // @ts-expect-error calling protected method
    await expect(exporter._addData()).rejects.toThrow(
      'Error when adding the model card revision(s) to the Tarball file.',
    )
  })

  test('_addData wraps error from addReleasesToTarball', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()
    vi.spyOn(exporter as any, 'addReleasesToTarball').mockImplementationOnce(() => {
      throw new Error('fail')
    })

    // @ts-expect-error calling protected method
    await expect(exporter._addData()).rejects.toThrow('Error when adding the release(s) to the Tarball file.')
  })

  test('addModelCardRevisionsToTarball propagates addEntry error', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    // @ts-expect-error calling protected method
    await expect(exporter.addModelCardRevisionsToTarball()).rejects.toThrow('fail')
  })

  test('addReleasesToTarball throws InternalError if any release fails', async () => {
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()
    vi.spyOn(exporter as any, 'addReleaseToTarball').mockRejectedValueOnce(new Error('fail'))

    // @ts-expect-error calling protected method
    await expect(exporter.addReleasesToTarball()).rejects.toThrow('Error when adding release(s) to Tarball file.')
  })

  test('addReleaseToTarball throws InternalError if entry fails', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel, [mockRelease], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    // @ts-expect-error calling protected method
    await expect(exporter.addReleaseToTarball(mockRelease)).rejects.toThrow('Error when generating the tarball file.')
  })

  test('addFilesToTarball throws InternalError if entry fails', async () => {
    tarballMocks.addEntryToTarGzUpload.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const exporter = new DocumentsExporter(mockUser, mockModel, [], mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = new PassThrough() as any
    exporter['uploadStream'] = new PassThrough() as any
    exporter['uploadPromise'] = Promise.resolve()

    // @ts-expect-error calling protected method
    await expect(exporter.addFilesToTarball([mockFile])).rejects.toThrow('Error when generating the tarball file.')
  })
})
