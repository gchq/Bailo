import { describe, expect, test, vi } from 'vitest'

import { parseFile, parseModelCard, parseRelease } from '../../../src/services/parsers/modelParser.js'

const s3Mocks = vi.hoisted(() => ({
  objectExists: vi.fn(() => Promise.resolve(true)),
}))
vi.mock('../../../src/clients/s3.js', () => s3Mocks)

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
      'importId',
    )

    expect(result).toMatchSnapshot()
  })

  test('parseModelCard > data not a model card', () => {
    expect(() => parseModelCard({}, '', '', '')).toThrowError('Data cannot be converted into a model card.')
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
        'importId',
      ),
    ).toThrowError('Compressed file contains model cards that have a model ID that does not match the source model Id.')
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
      'importId',
    )

    expect(result).toMatchSnapshot()
  })

  test('parseRelease > data not a release', () => {
    expect(() => parseRelease({}, '', '', '')).toThrowError('Data cannot be converted into a release.')
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
        'importId',
      ),
    ).toThrowError('Compressed file contains releases that have a model ID that does not match the source model Id.')
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
      'importId',
    )

    expect(result).toMatchSnapshot()
  })

  test('parseFile > data not a file', async () => {
    await expect(() => parseFile({}, '', '', '')).rejects.toThrowError('Data cannot be converted into a file.')
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
        'importId',
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
        'importId',
      ),
    ).rejects.toThrowError(
      'Compressed file contains files that have a model ID that does not match the source model Id.',
    )
  })
})
