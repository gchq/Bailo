import { describe, expect, test, vi } from 'vitest'

import { createFilePath, isFileWithScanResultsInterface } from '../../src/utils/fileUtils.js'

const mongooseMocks = vi.hoisted(() => ({
  isValidObjectId: vi.fn(() => true),
}))
vi.mock('mongoose', () => mongooseMocks)

describe('utils > array', () => {
  test('createFilePath', () => {
    expect(createFilePath('model123', 'file123')).toStrictEqual(`beta/model/model123/files/file123`)
    expect(createFilePath('', '')).toStrictEqual(`beta/model//files/`)
  })

  test('isFileWithScanResultsInterface > success', async () => {
    const result = isFileWithScanResultsInterface({
      _id: '',
      modelId: '',
      name: '',
      size: 1,
      mime: '',
      bucket: '',
      path: '',
      complete: true,
      tags: [],
      createdAt: '',
      updatedAt: '',
      id: '',
      scanResults: [],
      deleted: false,
      deletedAt: '',
      deletedBy: '',
    })

    expect(result).toBe(true)
  })

  test('isFileWithScanResultsInterface > missing property', async () => {
    const result = isFileWithScanResultsInterface({
      modelId: '',
      name: '',
      mime: '',
      path: '',
      complete: true,
      deleted: false,
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(false)
  })

  test('isFileWithScanResultsInterface > wrong type', async () => {
    const result = isFileWithScanResultsInterface(null)

    expect(result).toBe(false)
  })
})
