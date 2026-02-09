import { Readable } from 'node:stream'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ArtefactScanState } from '../../../../src/connectors/artefactScanning/Base.js'
import { FileAction } from '../../../../src/connectors/authorisation/actions.js'
import { FileExporter } from '../../../../src/services/mirroredModel/exporters/file.js'
import { BadReq, Forbidden, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
  addEntryToTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const fileServiceMocks = vi.hoisted(() => ({
  downloadFile: vi.fn(() => new Readable()),
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
    scannersInfo: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/artefactScanning/index.js', () => scannersMocks)

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

const mirroredModelMocks = vi.hoisted(() => ({
  MirrorKind: { File: 'file' },
}))
vi.mock('../../../../src/services/mirroredModel/mirroredModel.js', () => mirroredModelMocks)

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
  scanResults: [{ state: ArtefactScanState.Complete }],
} as any
const mockLogData = { extra: 'info', exporterType: 'FileExporter', exportId: 'exportId' }

describe('services > mirroredModel > exporters > FileExporter', () => {
  beforeEach(() => {
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    tarballMocks.addEntryToTarGzUpload.mockResolvedValue(undefined)
    authMocks.default.model.mockResolvedValue({ success: true })
    authMocks.default.file.mockResolvedValue({ success: true })
    scannersMocks.default.scannersInfo.mockReturnValue(false)
  })

  test('constructor sets file reference', () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    expect(exporter.getFile()).toEqual(mockFile)
  })

  test('_init succeeds with valid inputs', () => {
    scannersMocks.default.scannersInfo.mockReturnValue({ scannerNames: ['test'] })
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    // sync method, so just call and check no throw
    // @ts-expect-error calling protected method
    expect(() => exporter._init()).not.toThrow()
  })

  test('_checkAuths succeeds when authorisation passes', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    // @ts-expect-error calling protected method
    await expect(exporter._checkAuths()).resolves.toBeUndefined()

    expect(authMocks.default.file).toHaveBeenCalledWith(mockUser, mockModel, mockFile, FileAction.Download)
  })

  test('_checkAuths throws Forbidden if file authorisation fails', async () => {
    authMocks.default.file.mockResolvedValueOnce({ success: false, info: 'no file access' })
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)
    const expectedErr = Forbidden('no file access\nMethod `FileExporter._checkAuths` failure.', {
      userDn: mockUser.dn,
      modelId: mockModel.id,
      fileId: mockFile.id,
      ...mockLogData,
    })

    // @ts-expect-error calling protected method
    await expect(exporter._checkAuths()).rejects.toEqual(expectedErr)
  })

  test('_init throws BadReq if file too large', () => {
    const largeFile = { ...mockFile, size: 2000 }
    const exporter = new FileExporter(mockUser, mockModel, largeFile, mockLogData)
    const expectedErr = BadReq('Requested export is too large.\nMethod `FileExporter._init` failure.', {
      size: 2000,
      maxSize: configMocks.default.modelMirror.export.maxSize,
    })

    // @ts-expect-error calling protected method
    expect(() => exporter._init()).toThrowError(expectedErr)
  })

  test('_init throws BadReq if vulnerability scans missing', () => {
    scannersMocks.default.scannersInfo.mockReturnValue({ scannerNames: ['test'] })
    const badFile = { ...mockFile, scanResults: [] }
    const exporter = new FileExporter(mockUser, mockModel, badFile, mockLogData)
    const expectedErr = BadReq('The file is missing vulnerability scan(s).\nMethod `FileExporter._init` failure.', {
      filename: badFile.name,
      fileId: badFile.id,
    })

    // @ts-expect-error calling protected method
    expect(() => exporter._init()).toThrowError(expectedErr)
  })

  test('_init throws BadReq if vulnerability scans incomplete', () => {
    scannersMocks.default.scannersInfo.mockReturnValue({ scannerNames: ['test'] })
    const badFile = { ...mockFile, scanResults: [{ state: ArtefactScanState.InProgress }] }
    const exporter = new FileExporter(mockUser, mockModel, badFile, mockLogData)
    const expectedErr = BadReq('The file has incomplete vulnerability scan(s).\nMethod `FileExporter._init` failure.', {
      filename: badFile.name,
      fileId: badFile.id,
    })

    // @ts-expect-error calling protected method
    expect(() => exporter._init()).toThrowError(expectedErr)
  })

  test('_init throws BadReq if vulnerability scans infected', () => {
    scannersMocks.default.scannersInfo.mockReturnValue({ scannerNames: ['test'] })
    const badFile = {
      ...mockFile,
      scanResults: [{ state: ArtefactScanState.Complete, summary: [{ virus: 'Virus Found' }] }],
    }
    const exporter = new FileExporter(mockUser, mockModel, badFile, mockLogData)
    const expectedErr = BadReq('The file has failed vulnerability scan(s).\nMethod `FileExporter._init` failure.', {
      filename: badFile.name,
      fileId: badFile.id,
    })

    // @ts-expect-error calling protected method
    expect(() => exporter._init()).toThrowError(expectedErr)
  })

  test('getInitialiseTarGzUploadParams returns correct params', () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)

    // @ts-expect-error calling protected method
    const params = exporter.getInitialiseTarGzUploadParams()

    expect(params[0]).toBe(`${mockFile.id}.tar.gz`)
    expect(params[1]).toMatchObject({
      exporter: mockUser.dn,
      sourceModelId: mockModel.id,
      mirroredModelId: mockModel.settings.mirror.destinationModelId,
      filePath: mockFile.id,
      importKind: mirroredModelMocks.MirrorKind.File,
    })
    expect(params[2]).toEqual(mockLogData)
  })

  test('getInitialiseTarGzUploadParams throws if model missing', () => {
    const exporter = new FileExporter(mockUser, undefined as any, mockFile, mockLogData)

    // @ts-expect-error calling protected method
    expect(() => exporter.getInitialiseTarGzUploadParams()).toThrowError(
      /^Method `FileExporter.getInitialiseTarGzUploadParams` failed./,
    )
  })

  test('addData throws if not initialised', async () => {
    const exporter = new FileExporter(mockUser, mockModel, mockFile, mockLogData)
    const expectedErr = InternalError('Method `FileExporter.addData` called before `init()`.', mockLogData)
    await expect(exporter.addData()).rejects.toEqual(expectedErr)
  })

  test('addData success calls addEntryToTarGzUpload', async () => {
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
