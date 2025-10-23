import { PassThrough } from 'node:stream'
import zlib from 'node:zlib'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModelAction } from '../../../../src/connectors/authorisation/actions.js'
import { BaseExporter } from '../../../../src/services/mirroredModel/exporters/base.js'
import { BadReq, Forbidden, InternalError } from '../../../../src/utils/error.js'

const tarballMocks = vi.hoisted(() => ({
  initialiseTarGzUpload: vi.fn(),
  finaliseTarGzUpload: vi.fn(),
}))
vi.mock('../../../../src/services/mirroredModel/tarball.js', () => tarballMocks)

const authMocks = vi.hoisted(() => ({
  default: {
    model: vi.fn(),
  },
}))
vi.mock('../../../../src/connectors/authorisation/index.js', () => authMocks)

class TestExporter extends BaseExporter {
  addData() {
    // mock implementation
  }
  protected getInitialiseTarGzUploadParams() {
    return ['arg1', 'arg2'] as any
  }
}

const mockUser = { dn: 'userDN' } as any
const mockModel = {
  id: 'modelId',
  settings: { mirror: { destinationModelId: 'destModelId' } },
  card: { schemaId: 'schemaId' },
} as any
const mockLogData = { extra: 'info', exportId: 'exportId', exporterType: 'TestExporter' }

describe('connectors > mirroredModel > exporters > BaseExporter', () => {
  beforeEach(() => {
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    tarballMocks.finaliseTarGzUpload.mockResolvedValue(undefined)
    authMocks.default.model.mockResolvedValue({ success: true } as any)
  })

  test('constructor > success with ModelDoc', () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    expect(exporter.getModel()).toEqual(mockModel)
    expect(exporter).toMatchSnapshot()
  })

  test('_init > success with valid model', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    // @ts-expect-error protected method
    await exporter._init()

    expect(authMocks.default.model).toHaveBeenCalledWith(mockUser, mockModel, ModelAction.Export)
  })

  test('_init > throws BadReq if destinationModelId missing', async () => {
    const badModel = { ...mockModel, settings: { mirror: {} } }
    const exporter = new TestExporter(mockUser, badModel, mockLogData)
    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq("The 'Destination Model ID' has not been set on this model.", exporter['logData']),
    )
  })

  test('_init > throws BadReq if schemaId missing', async () => {
    const badModel = { ...mockModel, card: {} }
    const exporter = new TestExporter(mockUser, badModel, mockLogData)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      BadReq('You must select a schema for your model before you can start the export process.', exporter['logData']),
    )
  })

  test('_init > throws Forbidden if authorisation fails', async () => {
    authMocks.default.model.mockResolvedValueOnce({ success: false, info: 'not allowed' })
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    // @ts-expect-error protected method
    await expect(exporter._init()).rejects.toEqual(
      Forbidden('not allowed', { userDn: mockUser.dn, modelId: mockModel.id, ...exporter['logData'] }),
    )
  })

  test('_setupStreams > success calls initialiseTarGzUpload', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    await exporter._setupStreams()

    expect(tarballMocks.initialiseTarGzUpload).toHaveBeenCalled()
    expect(exporter['tarStream']).toBeDefined()
    expect(exporter['gzipStream']).toBeDefined()
    expect(exporter['uploadStream']).toBeDefined()
    expect(exporter['uploadPromise']).toBeDefined()
  })

  test('init > success runs _init and _setupStreams', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    await exporter.init()

    expect(exporter['initialised']).toBe(true)
    expect(exporter['tarStream']).toBeDefined()
  })

  test('finalise > throws if not initialised (sync throw from decorator)', () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    expect(() => exporter.finalise()).toThrowError(
      InternalError('Method `TestExporter.finalise` called before `init()`.', mockLogData),
    )
  })

  test('finalise > throws if streams missing (sync throw from decorator)', () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = undefined

    expect(() => exporter.finalise()).toThrowError(
      InternalError('Method `TestExporter.finalise` streams not initialised before use.', mockLogData),
    )
  })

  test('finalise > success calls finaliseTarGzUpload', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = {} as any
    exporter['gzipStream'] = {} as any
    exporter['uploadStream'] = {} as any
    exporter['uploadPromise'] = Promise.resolve()

    await exporter.finalise()

    expect(tarballMocks.finaliseTarGzUpload).toHaveBeenCalledWith(exporter['tarStream'], exporter['uploadPromise'])
  })

  test('withStreamCleanupClass > cleans up on error', () => {
    class ErrorExporter extends BaseExporter {
      addData() {
        throw new Error('fail')
      }
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new ErrorExporter(mockUser, mockModel, mockLogData)
    // @ts-expect-error mocking streams
    exporter['tarStream'] = new PassThrough()
    exporter['gzipStream'] = zlib.createGzip()
    exporter['uploadStream'] = new PassThrough()

    expect(() => exporter.addData()).toThrow('fail')

    // @ts-expect-error mocking streams
    expect(exporter['tarStream'].destroyed).toBe(true)
    expect(exporter['gzipStream'].destroyed).toBe(true)
    expect(exporter['uploadStream'].destroyed).toBe(true)
  })
})
