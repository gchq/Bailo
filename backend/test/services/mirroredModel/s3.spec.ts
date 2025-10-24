import { PassThrough, Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { getObjectFromExportS3Location, uploadToS3 } from '../../../src/services/mirroredModel/s3.js'

const configMock = vi.hoisted(
  () =>
    ({
      ui: {
        modelMirror: {
          import: {
            enabled: true,
          },
          export: {
            enabled: true,
          },
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
      registry: {
        connection: {
          internal: 'https://localhost:5000',
        },
      },
      connectors: {
        audit: {
          kind: 'silly',
        },
      },
    }) as any,
)
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

const logMock = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))
vi.mock('../../../src/services/log.js', async () => ({
  default: logMock,
}))

const s3Mocks = vi.hoisted(() => ({
  putObjectStream: vi.fn(() => Promise.resolve({ fileSize: 100 })),
  getObjectStream: vi.fn(() => Promise.resolve({ Body: new PassThrough() })),
  objectExists: vi.fn(() => Promise.resolve(true)),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const schemaMock = vi.hoisted(() => ({
  generateDigest: vi.fn(),
}))
vi.mock('../../../src/services/mirroredModel/mirroredModel.js', async () => schemaMock)

const kmsMocks = vi.hoisted(() => ({
  sign: vi.fn(),
}))
vi.mock('../../../src/clients/kms.js', () => kmsMocks)

describe('services > mirroredModel > s3', () => {
  test('uploadToS3 > single S3 upload when kms not enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: false,
        },
      },
    })
    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(1)
    expect(s3Mocks.getObjectStream).not.toHaveBeenCalled()
  })

  test('uploadToS3 > Double S3 upload when kms enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(2)
    expect(s3Mocks.getObjectStream).toHaveBeenCalled()
  })

  test('uploadToS3 > handle sign error', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    kmsMocks.sign.mockRejectedValueOnce('Error')

    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(logMock.error).toBeCalledWith(expect.objectContaining({}), 'Error generating signature for export.')
    expect(s3Mocks.getObjectStream).toHaveBeenCalled()
  })

  test('uploadToS3 > handle getObjectFromTemporaryS3Location error', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    s3Mocks.getObjectStream.mockRejectedValueOnce('Error')

    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(logMock.error).toMatchSnapshot()
    expect(s3Mocks.getObjectStream).toHaveBeenCalled()
  })

  test('uploadToS3 > Handle error when kms enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: true,
        },
      },
    })
    s3Mocks.putObjectStream.mockRejectedValueOnce('Error')

    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(1)
    expect(logMock.error).toHaveBeenCalled()
  })

  test('uploadToS3 > Handle error when kms not enabled', async () => {
    vi.spyOn(configMock, 'modelMirror', 'get').mockReturnValue({
      enabled: true,
      export: {
        maxSize: 10,
        kmsSignature: {
          enabled: false,
        },
      },
    })
    s3Mocks.putObjectStream.mockRejectedValueOnce('Error')

    await uploadToS3('', {} as unknown as Readable, {} as any)

    expect(s3Mocks.putObjectStream).toHaveBeenCalledTimes(1)
    expect(logMock.error).toHaveBeenCalled()
  })

  test('getObjectFromExportS3Location > success', async () => {
    await getObjectFromExportS3Location('', {} as any)

    expect(s3Mocks.getObjectStream).toHaveBeenCalled()
    expect(logMock.debug).toHaveBeenCalled()
    expect(logMock.error).not.toHaveBeenCalled()
  })

  test('getObjectFromExportS3Location > throw error', async () => {
    s3Mocks.getObjectStream.mockRejectedValueOnce('Error')

    const promise = getObjectFromExportS3Location('', {} as any)

    await expect(promise).rejects.toThrowError('Error')
    expect(logMock.error).toHaveBeenCalled()
  })
})
