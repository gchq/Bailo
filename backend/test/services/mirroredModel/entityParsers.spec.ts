import { describe, expect, test, vi } from 'vitest'

import { parseFile, parseModelCard, parseRelease } from '../../../src/services/mirroredModel/entityParsers.js'

const s3Mocks = vi.hoisted(() => ({
  objectExists: vi.fn(() => Promise.resolve(true)),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const fileUtilsMocks = vi.hoisted(() => ({
  isFileWithScanResultsInterface: vi.fn(() => true),
  createFilePath: vi.fn(() => 'beta/model/modelId/files/fileId'),
  validateFileName: vi.fn((name: string) => name),
}))
vi.mock('../../../src/utils/fileUtils.js', () => fileUtilsMocks)

const logMocks = vi.hoisted(() => ({
  default: { info: vi.fn() },
}))
vi.mock('../../../src/services/log.js', () => logMocks)

const modelMocks = vi.hoisted(() => ({
  isModelCardRevisionDoc: vi.fn(() => true),
}))
vi.mock('../../../src/services/model.js', () => modelMocks)

const releaseMocks = vi.hoisted(() => ({
  isReleaseDoc: vi.fn(() => true),
}))
vi.mock('../../../src/services/release.js', () => releaseMocks)

const mockLogData = { extra: 'info', importId: 'importId' }

describe('services > parsers > modelParser', () => {
  test('parseModelCard > success', () => {
    const result = parseModelCard(
      {
        modelId: 'sourceModelId',
        schemaId: 'schemaId',
        version: 2,
        createdBy: 'user',
        updatedAt: 'timestamp',
        createdAt: 'timestamp',
        _id: 'mongoId',
      },
      'mirroredModelId',
      'sourceModelId',
      mockLogData,
    )

    expect(result).toMatchSnapshot()
  })

  test('parseModelCard > data not a model card', () => {
    modelMocks.isModelCardRevisionDoc.mockReturnValueOnce(false)
    expect(() => parseModelCard({}, '', '', mockLogData)).toThrow('Data cannot be converted into a model card.')
  })

  test('parseModelCard > bad sourceModelId', () => {
    expect(() =>
      parseModelCard(
        {
          modelId: 'sourceModelId',
          schemaId: 'schemaId',
          version: 2,
          createdBy: 'user',
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'badSourceModelId',
        mockLogData,
      ),
    ).toThrow('Compressed file contains model cards that have a model ID that does not match the source model Id.')
  })

  test('parseRelease > success', () => {
    const result = parseRelease(
      {
        modelId: 'sourceModelId',
        modelCardVersion: 1,
        semver: '0.0.1',
        notes: 'notes',
        minor: false,
        draft: false,
        fileIds: [],
        images: [],
        deleted: false,
        createdBy: 'user',
        updatedAt: 'timestamp',
        createdAt: 'timestamp',
        _id: 'mongoId',
      },
      'mirroredModelId',
      'sourceModelId',
      mockLogData,
    )

    expect(result).toMatchSnapshot()
  })

  test('parseRelease > data not a release', () => {
    releaseMocks.isReleaseDoc.mockReturnValueOnce(false)
    expect(() => parseRelease({}, '', '', mockLogData)).toThrow('Data cannot be converted into a release.')
  })

  test('parseRelease > bad sourceModelId', () => {
    expect(() =>
      parseRelease(
        {
          modelId: 'sourceModelId',
          modelCardVersion: 1,
          semver: '0.0.1',
          notes: 'notes',
          minor: false,
          draft: false,
          fileIds: [],
          images: [],
          deleted: false,
          createdBy: 'user',
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'badSourceModelId',
        mockLogData,
      ),
    ).toThrow('Compressed file contains releases that have a model ID that does not match the source model Id.')
  })

  test('parseFile > success', () => {
    const result = parseFile(
      {
        modelId: 'sourceModelId',
        name: 'file.txt',
        size: 123,
        mime: 'text/plain',
        path: 'foo/file.txt',
        complete: true,
        deleted: false,
        updatedAt: 'timestamp',
        createdAt: 'timestamp',
        _id: 'mongoId',
      },
      'mirroredModelId',
      'sourceModelId',
      mockLogData,
    )

    expect(result).toMatchSnapshot()
  })

  test('parseFile > data not a file', async () => {
    fileUtilsMocks.isFileWithScanResultsInterface.mockReturnValueOnce(false)
    await expect(() => parseFile({}, '', '', mockLogData)).rejects.toThrow('Data cannot be converted into a file.')
  })

  test('parseFile > file does not exist', async () => {
    s3Mocks.objectExists.mockRejectedValueOnce('Error')
    await expect(() =>
      parseFile(
        {
          modelId: 'sourceModelId',
          name: 'file.txt',
          size: 123,
          mime: 'text/plain',
          path: 'foo/file.txt',
          complete: true,
          deleted: false,
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'sourceModelId',
        mockLogData,
      ),
    ).rejects.toThrow('Error checking existence of file in storage.')
  })

  test('parseFile > name is not a string', async () => {
    await expect(() =>
      parseFile(
        {
          modelId: 'sourceModelId',
          name: 123,
          size: 123,
          mime: 'text/plain',
          path: 'foo/file.txt',
          complete: true,
          deleted: false,
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'sourceModelId',
        mockLogData,
      ),
    ).rejects.toThrow('Compressed file contains a file whose name is not a string.')
  })

  test('parseFile > invalid name is rejected', async () => {
    fileUtilsMocks.validateFileName.mockImplementationOnce(() => {
      throw new Error('File name must not contain path traversal segments.')
    })
    await expect(() =>
      parseFile(
        {
          modelId: 'sourceModelId',
          name: '../../escape.txt',
          size: 123,
          mime: 'text/plain',
          path: 'foo/file.txt',
          complete: true,
          deleted: false,
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'sourceModelId',
        mockLogData,
      ),
    ).rejects.toThrow('Compressed file contains a file with an invalid name.')
  })

  test('parseFile > name is validated before the storage lookup', async () => {
    await parseFile(
      {
        modelId: 'sourceModelId',
        name: 'folder/file.txt',
        size: 123,
        mime: 'text/plain',
        path: 'foo/file.txt',
        complete: true,
        deleted: false,
        updatedAt: 'timestamp',
        createdAt: 'timestamp',
        _id: 'mongoId',
      },
      'mirroredModelId',
      'sourceModelId',
      mockLogData,
    )

    expect(fileUtilsMocks.validateFileName).toHaveBeenCalledWith('folder/file.txt')
  })

  test('parseFile > bad sourceModelId', async () => {
    await expect(() =>
      parseFile(
        {
          modelId: 'sourceModelId',
          name: 'file.txt',
          size: 123,
          mime: 'text/plain',
          path: 'foo/file.txt',
          complete: true,
          deleted: false,
          updatedAt: 'timestamp',
          createdAt: 'timestamp',
          _id: 'mongoId',
        },
        'mirroredModelId',
        'badSourceModelId',
        mockLogData,
      ),
    ).rejects.toThrow('Compressed file contains files that have a model ID that does not match the source model Id.')
  })
})
