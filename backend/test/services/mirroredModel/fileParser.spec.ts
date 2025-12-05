import { describe, expect, test, vi } from 'vitest'

import { parseFile } from '../../../src/services/mirroredModel/fileParser.js'

const s3Mocks = vi.hoisted(() => ({
  objectExists: vi.fn(() => Promise.resolve(true)),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

const mockLogData = { extra: 'info', importId: 'importId' }

describe('services > parsers > modelParser', () => {
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
    await expect(() => parseFile({}, '', '', mockLogData)).rejects.toThrowError('Data cannot be converted into a file.')
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
    ).rejects.toThrowError('Error checking existence of file in storage.')
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
    ).rejects.toThrowError(
      'Compressed file contains files that have a model ID that does not match the source model Id.',
    )
  })
})
