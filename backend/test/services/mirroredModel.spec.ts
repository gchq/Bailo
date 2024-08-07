import { PassThrough } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/authorisation/index.js'
import { UserInterface } from '../../src/models/User.js'
import { exportModel } from '../../src/services/mirroredModel.js'

const authMock = vi.hoisted(() => ({
  model: vi.fn(() => ({ success: true })),
}))
vi.mock('../../src/connectors/authorisation/index.js', async () => ({
  default: authMock,
}))

const configMock = vi.hoisted(
  () =>
    ({
      ui: {
        modelMirror: {
          enabled: true,
        },
      },
      s3: { buckets: { uploads: 'test' } },
      modelMirror: {
        export: {
          maxSize: 100,
          kmsSignature: {
            enabled: true,
          },
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../src/services/log.js', async () => ({
  default: logMock,
}))

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(() => ({ settings: { mirror: { destinationModelId: '123' } } })),
  getModelCardRevisions: vi.fn(() => [{ toJSON: vi.fn(), version: 123 }]),
}))
vi.mock('../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  getReleasesForExport: vi.fn(() => [{ toJSON: vi.fn() }]),
  getAllFileIds: vi.fn(() => [{}]),
}))
vi.mock('../../src/services/release.js', () => releaseMocks)

const fileMocks = vi.hoisted(() => ({
  getFilesByIds: vi.fn(() => [{ _id: '123', avScan: { state: 'complete', isInfected: false }, toJSON: vi.fn() }]),
  getTotalFileSize: vi.fn(() => 42),
  downloadFile: vi.fn(() => ({ Body: 'test' })),
}))
vi.mock('../../src/services/file.js', () => fileMocks)

const archiverMocks = vi.hoisted(() => ({
  append: vi.fn(),
  finalize: vi.fn(),
  pipe: vi.fn(),
}))
vi.mock('archiver', () => ({ default: vi.fn(() => archiverMocks) }))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => Promise.resolve({ fileSize: 100 })),
  getObjectStream: vi.fn(() => Promise.resolve({ Body: new PassThrough() })),
}))
vi.mock('../../src/clients/s3.js', () => s3Mocks)

const kmsMocks = vi.hoisted(() => ({
  sign: vi.fn(),
}))
vi.mock('../../src/clients/kms.js', () => kmsMocks)

const hashMocks = vi.hoisted(() => ({
  createHash: vi.fn(() => ({
    setEncoding: vi.fn(),
    end: vi.fn(),
    read: vi.fn(() => 'test digest'),
  })),
}))
vi.mock('node:crypto', () => hashMocks)

const streamMocks = vi.hoisted(() => ({
  PassThrough: vi.fn(() => ({
    pipe: vi.fn(),
    on: vi.fn((a, b) => {
      b()
    }),
  })),
}))
vi.mock('stream', () => streamMocks)

describe('services > mirroredModel', () => {
  test('exportModel > not enabled', async () => {
    vi.spyOn(configMock, 'ui', 'get').mockReturnValueOnce({ modelMirror: { enabled: false } })
    const response = exportModel({} as UserInterface, 'modelId', true)

    expect(response).rejects.toThrowError('Model mirroring has not been enabled.')
  })

  test('exportModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValueOnce({ info: 'You do not have permission', success: false, id: '' })

    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^You do not have permission/)
  })

  test('exportModel > missing disclaimer agreement', async () => {
    const response = exportModel({} as UserInterface, 'modelId', false)
    expect(response).rejects.toThrowError(
      /^You must agree to the disclaimer agreement before being able to export a model./,
    )
  })

  test('exportModel > unable to create model card zip file', async () => {
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true)
    expect(response).rejects.toThrowError(/^Error when adding the model card revision\(s\) to the zip file./)
  })

  test('exportModel > unable to create release zip file', async () => {
    archiverMocks.append.mockReturnValueOnce({})
    archiverMocks.append.mockImplementationOnce(() => {
      throw Error('Error making zip file')
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when adding the release\(s\) to the zip file./)
  })

  test('exportModel > unable to create digest for zip file', async () => {
    hashMocks.createHash.mockImplementationOnce(() => {
      throw Error()
    })
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(
      expect.any(Object),
      'Failed to upload export to export location with signatures',
    )
  })

  test('exportModel > unable to create kms signature for zip file', async () => {
    kmsMocks.sign.mockRejectedValueOnce('Error')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(
      expect.any(Object),
      'Failed to upload export to export location with signatures',
    )
  })

  test('exportModel > release export size too large', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    fileMocks.getTotalFileSize.mockReturnValueOnce(100)
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '1.2.4'])
    expect(response).rejects.toThrowError(/^Requested export is too large./)
  })

  test('exportModel > successful export if no files exist', async () => {
    releaseMocks.getAllFileIds.mockResolvedValueOnce([])
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '1.2.4'])
    // Allow for completion of asynchronous content
    await new Promise((r) => setTimeout(r))
    expect(s3Mocks.putObjectStream).toBeCalledTimes(2)
  })

  test('exportModel > missing mirrored model ID', async () => {
    modelMocks.getModelById.mockReturnValueOnce({
      settings: { mirror: { destinationModelId: '' } },
    })
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^The ID of the mirrored model has not been set on this model./)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export contains infected file', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      { _id: '123', avScan: { state: 'complete', isInfected: true }, toJSON: vi.fn() },
      { _id: '321', avScan: { state: 'complete', isInfected: false }, toJSON: vi.fn() },
    ])
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when adding the release\(s\) to the zip file./)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export contains incomplete file scan', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      { _id: '123', avScan: { state: 'inProgress' } as any, toJSON: vi.fn() },
      { _id: '321', avScan: { state: 'complete', isInfected: false }, toJSON: vi.fn() },
    ])
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when adding the release\(s\) to the zip file./)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > export missing file scan', async () => {
    fileMocks.getFilesByIds.mockReturnValueOnce([
      { _id: '123', toJSON: vi.fn() } as any,
      { _id: '321', avScan: { state: 'complete', isInfected: false }, toJSON: vi.fn() },
    ])
    const response = exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    expect(response).rejects.toThrowError(/^Error when adding the release\(s\) to the zip file./)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(0)
  })

  test('exportModel > upload straight to the export bucket if signatures are disabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        bucket: 'exports',
        kmsSignature: {
          enabled: false,
        },
      },
    })

    await exportModel({} as UserInterface, 'modelId', true)
    expect(s3Mocks.putObjectStream).toHaveBeenCalledWith(
      'exports',
      'modelId.zip',
      expect.any(Object),
      expect.any(Object),
    )
    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(1)
  })

  test('exportModel > log error if unable to upload to export s3 storage', async () => {
    s3Mocks.putObjectStream.mockRejectedValueOnce('')
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        kmsSignature: {
          enabled: false,
        },
      },
    })

    await exportModel({} as UserInterface, 'modelId', true)
    expect(logMock.error).toHaveBeenCalledWith(expect.any(Object), 'Failed to export to export S3 location.')
  })

  test('exportModel > export uploaded to S3 with signatures', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        kmsSignature: {
          enabled: true,
        },
      },
    })
    await exportModel({} as UserInterface, 'modelId', true)
    expect(s3Mocks.putObjectStream).toBeCalledTimes(1)
  })

  test('exportModel > export uploaded to S3 for model cards and releases', async () => {
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3', '3.2.1'])

    expect(s3Mocks.putObjectStream).toBeCalledTimes(2)
  })

  test('exportModel > unable to upload to tmp S3 location', async () => {
    s3Mocks.putObjectStream.mockRejectedValueOnce('')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(expect.any(Object), 'Failed to export to temporary S3 location.')
  })

  test('exportModel > unable to get object from tmp S3 location', async () => {
    s3Mocks.getObjectStream.mockRejectedValueOnce('')
    await exportModel({} as UserInterface, 'modelId', true, ['1.2.3'])
    await new Promise((r) => setTimeout(r))
    expect(logMock.error).toBeCalledWith(expect.any(Object), 'Failed to retrieve stream from temporary S3 location.')
  })
})
