import { PassThrough } from 'node:stream'
import zlib from 'node:zlib'

import { beforeEach, describe, expect, test, vi } from 'vitest'

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
  // no-ops for testing
  protected async _init() {}
  protected async _addData() {}
  protected async _checkAuths() {}
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
const mockLogData = { extra: 'info', exportId: 'exportId' }

describe('services > mirroredModel > exporters > BaseExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tarballMocks.initialiseTarGzUpload.mockResolvedValue({
      tarStream: {} as any,
      gzipStream: {} as any,
      uploadStream: {} as any,
      uploadPromise: Promise.resolve(),
    })
    tarballMocks.finaliseTarGzUpload.mockResolvedValue(undefined)
    authMocks.default.model.mockResolvedValue({ success: true } as any)
  })

  test('constructor sets model, user, logData', () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    expect(exporter.getModel()).toBe(mockModel)
    expect(exporter.getLogData()).toMatchObject({
      exporterType: 'TestExporter',
      ...mockLogData,
    })
  })

  test('init throws if destinationModelId missing', async () => {
    const badModel = { ...mockModel, settings: { mirror: {} } }
    const exporter = new TestExporter(mockUser, badModel, mockLogData)

    await expect(exporter.init()).rejects.toEqual(
      BadReq("The 'Destination Model ID' has not been set on this model.", exporter.getLogData()),
    )
  })

  test('init throws if schemaId missing', async () => {
    const badModel = { ...mockModel, card: {} }
    const exporter = new TestExporter(mockUser, badModel, mockLogData)

    await expect(exporter.init()).rejects.toEqual(
      BadReq('You must select a schema for your model before export.', exporter.getLogData()),
    )
  })

  test('init sets initialised true on success', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    await exporter.init()

    expect(exporter['initialised']).toBe(true)
  })

  test('checkAuths calls _checkModelAuths and _checkAuths only once', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    const spyModelAuth = vi.spyOn(exporter as any, '_checkModelAuths')
    const spyExtraAuth = vi.spyOn(exporter as any, '_checkAuths')

    await exporter.checkAuths()
    await exporter.checkAuths()

    expect(spyModelAuth).toHaveBeenCalledTimes(1)
    expect(spyExtraAuth).toHaveBeenCalledTimes(1)
  })

  test('_checkModelAuths throws Forbidden if authorisation fails', async () => {
    authMocks.default.model.mockResolvedValueOnce({ success: false, info: 'nope' })
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    await expect(exporter['_checkModelAuths']()).rejects.toEqual(
      Forbidden('nope', { userDn: mockUser.dn, modelId: mockModel.id, ...exporter.getLogData() }),
    )
  })

  test('setupStreams sets stream properties', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    exporter['initialised'] = true

    await exporter['setupStreams']()

    expect(exporter['tarStream']).toBeDefined()
    expect(exporter['gzipStream']).toBeDefined()
    expect(exporter['uploadStream']).toBeDefined()
    expect(exporter['uploadPromise']).toBeDefined()
  })

  test('addData runs after decorators', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    exporter['initialised'] = true
    const spyAdd = vi.spyOn(exporter as any, '_addData').mockResolvedValue(undefined)

    await exporter.addData()

    expect(spyAdd).toHaveBeenCalled()
  })

  test('addData fails if not initialised', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)

    await expect(exporter.addData()).rejects.toEqual(
      InternalError('Method `TestExporter.addData` called before `init()`.', exporter.getLogData()),
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

  test('finalise > define streams if missing', async () => {
    const exporter = new TestExporter(mockUser, mockModel, mockLogData)
    exporter['initialised'] = true
    exporter['tarStream'] = undefined

    await exporter.finalise()

    expect(tarballMocks.finaliseTarGzUpload).toHaveBeenCalled()
    expect(exporter['tarStream']).not.toBeUndefined()
    expect(exporter['gzipStream']).not.toBeUndefined()
    expect(exporter['uploadStream']).not.toBeUndefined()
    expect(exporter['uploadPromise']).not.toBeUndefined()
  })

  test('withStreamCleanupClass cleans up on sync error', async () => {
    class ErrorExporter extends BaseExporter {
      protected async _init() {}
      protected async _addData() {
        throw new Error('fail')
      }
      protected async _checkAuths() {}
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new ErrorExporter(mockUser, mockModel, mockLogData)
    // @ts-expect-ignore accessing protected property
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = zlib.createGzip()
    exporter['uploadStream'] = new PassThrough()

    await expect(exporter['_addData']()).rejects.toThrow('fail')

    // @ts-expect-ignore accessing protected property
    expect(exporter['tarStream']!.destroyed).toBe(true)
    expect(exporter['gzipStream'].destroyed).toBe(true)
    expect(exporter['uploadStream'].destroyed).toBe(true)
  })

  test('withStreamCleanupClass cleans up on async error', async () => {
    class AsyncErrorExporter extends BaseExporter {
      protected async _init() {}
      protected async _addData() {
        return Promise.reject(InternalError('async fail'))
      }
      protected async _checkAuths() {}
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new AsyncErrorExporter(mockUser, mockModel, mockLogData)
    // @ts-expect-ignore accessing protected property
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = zlib.createGzip()
    exporter['uploadStream'] = new PassThrough()

    await expect(exporter['_addData']()).rejects.toThrow('async fail')

    // @ts-expect-ignore accessing protected property
    expect(exporter['tarStream']!.destroyed).toBe(true)
    expect(exporter['gzipStream'].destroyed).toBe(true)
    expect(exporter['uploadStream'].destroyed).toBe(true)
  })

  test('withStreams decorator triggers wrapErrorContext when setupStreams throws', async () => {
    class StreamFailExporter extends BaseExporter {
      protected async _init() {}
      protected async _addData() {}
      protected async _checkAuths() {}
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new StreamFailExporter(mockUser, mockModel, mockLogData) as any
    exporter.initialised = true
    vi.spyOn(exporter, 'setupStreams').mockImplementationOnce(() => {
      throw new Error('setup fail')
    })
    // forcibly skip tarStream presence so withStreams will try setupStreams
    exporter.tarStream = undefined

    await expect(exporter.addData()).rejects.toThrow(/failed/)
  })

  test('checkAuths decorator triggers wrapErrorContext when pre-check throws', async () => {
    class AuthFailExporter extends BaseExporter {
      protected async _init() {}
      protected async _addData() {}
      protected async _checkAuths() {}
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new AuthFailExporter(mockUser, mockModel, mockLogData) as any
    exporter.initialised = true
    vi.spyOn(exporter, 'checkAuths').mockImplementationOnce(() => {
      throw new Error('auth fail')
    })

    const prom = exporter.addData()

    await expect(prom).rejects.toThrow(/failed/)
  })

  test('withStreamCleanupClass hits sync catch branch', () => {
    class SyncThrowExporter extends BaseExporter {
      syncMethod() {
        throw InternalError('sync fail')
      }
      protected async _init() {}
      protected async _addData() {}
      protected async _checkAuths() {}
      protected getInitialiseTarGzUploadParams() {
        return [] as any
      }
    }
    const exporter = new SyncThrowExporter(mockUser, mockModel, mockLogData)
    exporter['tarStream'] = new PassThrough() as any
    exporter['gzipStream'] = zlib.createGzip()
    exporter['uploadStream'] = new PassThrough()

    expect(() => exporter.syncMethod()).toThrow('sync fail')

    expect(exporter['tarStream']!.destroyed).toBe(true)
    expect(exporter['gzipStream'].destroyed).toBe(true)
    expect(exporter['uploadStream'].destroyed).toBe(true)
  })
})
