import { describe, expect, test, vi } from 'vitest'

import {
  createFilePath,
  getFileBaseName,
  getFileDirectory,
  isFileWithScanResultsInterface,
  validateFileName,
} from '../../src/utils/fileUtils.js'

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

  describe('validateFileName', () => {
    test('accepts a simple filename', () => {
      expect(validateFileName('model.bin')).toBe('model.bin')
    })

    test('accepts a path-like filename', () => {
      expect(validateFileName('weights/model.bin')).toBe('weights/model.bin')
    })

    test('accepts a deeply nested path', () => {
      expect(validateFileName('a/b/c/d/model.bin')).toBe('a/b/c/d/model.bin')
    })

    test('trims whitespace', () => {
      expect(validateFileName('  model.bin  ')).toBe('model.bin')
    })

    test('rejects empty name', () => {
      expect(() => validateFileName('')).toThrow('File name must not be empty')
    })

    test('rejects whitespace-only name', () => {
      expect(() => validateFileName('   ')).toThrow('File name must not be empty')
    })

    test('rejects leading slash', () => {
      expect(() => validateFileName('/model.bin')).toThrow('must not start or end with a slash')
    })

    test('rejects trailing slash', () => {
      expect(() => validateFileName('weights/')).toThrow('must not start or end with a slash')
    })

    test('rejects empty path segments', () => {
      expect(() => validateFileName('weights//model.bin')).toThrow('empty path segments')
    })

    test('rejects dot traversal segment', () => {
      expect(() => validateFileName('weights/./model.bin')).toThrow('path traversal')
    })

    test('rejects double-dot traversal segment', () => {
      expect(() => validateFileName('../etc/passwd')).toThrow('path traversal')
    })

    test('rejects backslashes', () => {
      expect(() => validateFileName('weights\\model.bin')).toThrow('backslashes')
    })

    test('rejects null bytes', () => {
      expect(() => validateFileName('model\0.bin')).toThrow('null bytes')
    })
  })

  describe('getFileDirectory', () => {
    test('returns empty string for root-level file', () => {
      expect(getFileDirectory('model.bin')).toBe('')
    })

    test('returns directory for single-level path', () => {
      expect(getFileDirectory('weights/model.bin')).toBe('weights')
    })

    test('returns full directory for nested path', () => {
      expect(getFileDirectory('a/b/c/model.bin')).toBe('a/b/c')
    })
  })

  describe('getFileBaseName', () => {
    test('returns full name for root-level file', () => {
      expect(getFileBaseName('model.bin')).toBe('model.bin')
    })

    test('returns basename for single-level path', () => {
      expect(getFileBaseName('weights/model.bin')).toBe('model.bin')
    })

    test('returns basename for nested path', () => {
      expect(getFileBaseName('a/b/c/model.bin')).toBe('model.bin')
    })
  })
})
