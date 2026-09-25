import { validateFolderPath } from 'utils/fileTreeUtils'
import { describe, expect, it } from 'vitest'

describe('File tree utils', () => {
  describe('validateFolderPath', () => {
    it('returns null for an empty path, as this means the model root', () => {
      expect(validateFolderPath('')).toBe(null)
    })

    it('returns null for a valid single segment path', () => {
      expect(validateFolderPath('models')).toBe(null)
    })

    it('returns null for a valid nested path', () => {
      expect(validateFolderPath('models/v2/weights')).toBe(null)
    })

    it('rejects a path containing only whitespace', () => {
      expect(validateFolderPath('   ')).toBe('Path cannot be empty')
    })

    it('rejects a path starting with a slash', () => {
      expect(validateFolderPath('/models')).toBe('Path should not start or end with a slash')
    })

    it('rejects a path ending with a slash', () => {
      expect(validateFolderPath('models/')).toBe('Path should not start or end with a slash')
    })

    it('rejects a path containing double slashes', () => {
      expect(validateFolderPath('models//v2')).toBe('Path should not contain double slashes')
    })

    it('rejects a path containing empty segments', () => {
      expect(validateFolderPath('models/ /v2')).toBe('Path contains empty segments')
    })
  })
})
