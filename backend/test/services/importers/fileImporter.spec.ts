import { Readable } from 'stream'
import { describe, expect, test, vi } from 'vitest'

import { importModelFile } from '../../../src/services/importers/fileImporter.js'

const configMock = vi.hoisted(
  () =>
    ({
      s3: {
        buckets: {
          uploads: 'uploads',
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
  putObjectStream: vi.fn(),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const fileMocks = vi.hoisted(() => ({
  createFilePath: vi.fn(() => 'file/path'),
  markFileAsCompleteAfterImport: vi.fn(),
}))
vi.mock('../../../src/services/file.js', () => fileMocks)

const fileModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.findOne = vi.fn()

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../../src/models/File.js', () => ({ default: fileModelMocks }))

describe('services > importers > fileImporter', () => {
  test('importModelFile > success', async () => {
    const result = await importModelFile({} as Readable, 'fileId', 'mirroredModelId', 'importId')

    expect(fileMocks.createFilePath).toBeCalledTimes(1)
    expect(fileModelMocks.findOne).toBeCalledTimes(1)
    expect(s3Mocks.putObjectStream).toBeCalledTimes(1)
    expect(fileMocks.markFileAsCompleteAfterImport).toBeCalledTimes(1)
    expect(result).toMatchSnapshot()
  })

  test('importModelFile > skip complete', async () => {
    fileModelMocks.findOne.mockResolvedValue({ complete: true })

    const result = await importModelFile({} as Readable, 'fileId', 'mirroredModelId', 'importId')

    expect(fileMocks.createFilePath).toBeCalledTimes(1)
    expect(fileModelMocks.findOne).toBeCalledTimes(1)
    expect(s3Mocks.putObjectStream).not.toBeCalled()
    expect(fileMocks.markFileAsCompleteAfterImport).not.toBeCalled()
    expect(result).toMatchSnapshot()
  })
})
