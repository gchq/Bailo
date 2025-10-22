import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FileAction } from '../../../../src/connectors/authorisation/actions.js'
import { ScanState } from '../../../../src/connectors/fileScanning/Base.js'
import { FileExporter } from '../../../../src/connectors/mirroredModel/exporters/file.js'
import { MirrorKind } from '../../../../src/connectors/mirroredModel/index.js'
import { BadReq, Forbidden, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
  addEntryToTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const fileServiceMocks = vi.hoisted(() => ({
  downloadFile: vi.fn(),
}))
vi.mock('../../../../src/services/file.js', () => fileServiceMocks)

const authMocks = vi.hoisted(() => ({
  default: {
    model: vi.fn(),
    file: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

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
    log: {
      level: 'debug',
    },
    instrumentation: {
      enabled: false,
    },
  },
}))
vi.mock('../../../../src/utils/config.js', () => configMocks)

const mockUser = { dn: 'userDN' } as any
const mockModel = {
  id: 'modelId',
  settings: { mirror: { destinationModelId: 'destModelId' } },
  card: { schemaId: 'schemaId' },
} as any
const mockFile = {
  id: 'fileId',
  name: 'test.txt',
  size: 500,
  avScan: [{ state: ScanState.Complete, isInfected: false }],
} as any
const mockLogData = { extra: 'info', exporterType: 'FileExporter' }

describe('connectors > mirroredModel > exporters > FileExporter', () => {
  beforeEach(() => {
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    tarballMocks.addEntryToTarGzUpload.mockResolvedValue(undefined)
    fileServiceMocks.downloadFile.mockResolvedValue({ Body: new Readable() })
    authMocks.default.model.mockResolvedValue({ success: true })
    authMocks.default.file.mockResolvedValue({ success: true })
    scannersMocks.default.info.mockReturnValue(false)
  })

  test('constructor > sets file and logData', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    expect(exporter.getFile()).toEqual(mockFile)

    expect(exporter).toMatchSnapshot()
  })

  test('_init > success with valid inputs', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile)

    // @ts-expect-error protected method
    await exporter._init()

    expect(authMocks.default.model).toHaveBeenCalled()
    expect(authMocks.default.file).toHaveBeenCalledWith(mockUser, mockModel, mockFile, FileAction.Download)
  })

  test('_init > throws Forbidden if file authorisation fails', async () => {
    authMocks.default.file.mockResolvedValueOnce({ success: false, info: 'no file access' })
    const exporter = new FileExporter(mockUser, mockModel, mockFile)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      Forbidden('no file access', {
        userDn: mockUser.dn,
        modelId: mockModel.id,
        fileId: mockFile.id,
        exporterType: 'FileExporter',
      }),
    )
  })

  test('_init > throws BadReq if file too large', async () => {
    const largeFile = { ...mockFile, size: 2000 }
    const exporter = new FileExporter(mockUser, mockModel, largeFile)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq('Requested export is too large.', {
        size: 2000,
        maxSize: configMocks.default.modelMirror.export.maxSize,
      }),
    )
  })

  test('_init > throws BadReq if AV scans missing', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const badFile = { ...mockFile, avScan: [] }
    const exporter = new FileExporter(mockUser, mockModel, badFile)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq('The file is missing AV scan(s).', { filename: badFile.name, fileId: badFile.id }),
    )
  })

  test('_init > throws BadReq if AV scans incomplete', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const badFile = { ...mockFile, avScan: [{ state: ScanState.InProgress, isInfected: false }] }
    const exporter = new FileExporter(mockUser, mockModel, badFile)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq('The file has incomplete AV scan(s).', { filename: badFile.name, fileId: badFile.id }),
    )
  })

  test('_init > throws BadReq if AV scans infected', async () => {
    scannersMocks.default.info.mockReturnValue(true)
    const badFile = { ...mockFile, avScan: [{ state: ScanState.Complete, isInfected: true }] }
    const exporter = new FileExporter(mockUser, mockModel, badFile)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq('The file has failed AV scan(s).', { filename: badFile.name, fileId: badFile.id }),
    )
  })

  test('getInitialiseTarGzUploadParams > returns correct params', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    // @ts-expect-error protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe(`${mockFile.id}.tar.gz`)
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      filePath: mockFile.id,
      importKind: MirrorKind.File,
    })
    expect(params[2]).toEqual(mockLogData)
  })

  test('getInitialiseTarGzUploadParams > throws if model missing', () => {
    const exporter = new FileExporter(mockUser, undefined as any, mockFile)

    // @ts-expect-error protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(
      InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        exporterType: 'FileExporter',
      }),
    )
  })

  test('addData > throws if not initialised', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile)

    expect(() => exporter.addData()).toThrowError(
      InternalError('Method `addData` called before `init()`.', { exporterType: 'FileExporter' }),
    )
  })

  test('addData > success calls addEntryToTarGzUpload', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = {} as any
    exporter['gzipStream'] = {} as any
    exporter['uploadStream'] = {} as any
    exporter['uploadPromise'] = Promise.resolve()

    await exporter.addData()

    expect(fileServiceMocks.downloadFile).toHaveBeenCalledWith(mockUser, mockFile.id)
    expect(tarballMocks.addEntryToTarGzUpload).toHaveBeenCalledWith(
      exporter['tarStream'],
      expect.objectContaining({
        type: 'stream',
        filename: mockFile.id,
        size: mockFile.size,
        stream: expect.any(Readable),
      }),
      mockLogData,
    )
  })
})
