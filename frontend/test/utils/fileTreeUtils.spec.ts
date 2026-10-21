import { FileInterface, FileUploadWithMetadata } from 'types/types'
import {
  buildFileTree,
  buildFolderSearchableText,
  collectAllFileNames,
  countMatchingFiles,
  detectFileConflicts,
  getBreadcrumbParts,
  getFileBaseName,
  getFileUploadName,
  getFolderDates,
  getNodeAtPath,
  hasAnyNestedFiles,
  joinUploadPath,
  validateFolderPath,
} from 'utils/fileTreeUtils'
import { describe, expect, it } from 'vitest'

function makeFile(name: string, dates?: { createdAt?: Date; updatedAt?: Date }): FileInterface {
  return {
    _id: name,
    modelId: 'model1',
    name,
    size: 100,
    mime: 'application/octet-stream',
    path: `beta/model/model1/files/${name}`,
    complete: true,
    tags: [],
    createdAt: dates?.createdAt ?? new Date(),
    updatedAt: dates?.updatedAt ?? new Date(),
  } as FileInterface
}

describe('File tree utils', () => {
  describe('getFileBaseName', () => {
    it('returns full name for flat file', () => {
      expect(getFileBaseName('model.bin')).toBe('model.bin')
    })

    it('returns basename for nested path', () => {
      expect(getFileBaseName('weights/subdir/model.bin')).toBe('model.bin')
    })
  })

  describe('buildFileTree', () => {
    it('builds tree from flat files', () => {
      const files = [makeFile('a.txt'), makeFile('b.txt')]
      const tree = buildFileTree(files)

      expect(tree.children).toHaveLength(2)
      expect(tree.children[0].isDirectory).toBe(false)
      expect(tree.children[0].name).toBe('a.txt')
      expect(tree.totalFileCount).toBe(2)
    })

    it('builds tree from nested files', () => {
      const files = [makeFile('weights/model.bin'), makeFile('weights/config.json'), makeFile('README.md')]
      const tree = buildFileTree(files)

      expect(tree.children).toHaveLength(2)

      const weightsDir = tree.children.find((c) => c.name === 'weights')
      expect(weightsDir).toBeDefined()
      expect(weightsDir!.isDirectory).toBe(true)
      expect(weightsDir!.children).toHaveLength(2)
      expect(weightsDir!.totalFileCount).toBe(2)

      const readme = tree.children.find((c) => c.name === 'README.md')
      expect(readme).toBeDefined()
      expect(readme!.isDirectory).toBe(false)
    })

    it('builds deeply nested tree', () => {
      const files = [makeFile('a/b/c/file.txt')]
      const tree = buildFileTree(files)

      const a = tree.children[0]
      expect(a.name).toBe('a')
      expect(a.isDirectory).toBe(true)

      const b = a.children[0]
      expect(b.name).toBe('b')
      expect(b.fullPath).toBe('a/b')

      const c = b.children[0]
      expect(c.name).toBe('c')
      expect(c.fullPath).toBe('a/b/c')
      expect(c.totalFileCount).toBe(1)

      const file = c.children[0]
      expect(file.name).toBe('file.txt')
      expect(file.isDirectory).toBe(false)
      expect(file.file).toBeDefined()
    })

    it('returns empty tree for empty files', () => {
      const tree = buildFileTree([])
      expect(tree.children).toHaveLength(0)
      expect(tree.totalFileCount).toBe(0)
    })
  })

  describe('getNodeAtPath', () => {
    it('returns root for empty path', () => {
      const tree = buildFileTree([makeFile('a.txt')])
      const node = getNodeAtPath(tree, '')
      expect(node).toBe(tree)
    })

    it('returns directory node at path', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const node = getNodeAtPath(tree, 'weights')
      expect(node).toBeDefined()
      expect(node!.name).toBe('weights')
      expect(node!.children).toHaveLength(1)
    })

    it('returns undefined for non-existent path', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const node = getNodeAtPath(tree, 'config')
      expect(node).toBeUndefined()
    })
  })

  describe('getBreadcrumbParts', () => {
    it('returns empty array for empty path', () => {
      expect(getBreadcrumbParts('')).toEqual([])
    })

    it('returns single segment', () => {
      expect(getBreadcrumbParts('weights')).toEqual([{ name: 'weights', fullPath: 'weights' }])
    })

    it('returns cumulative path segments', () => {
      expect(getBreadcrumbParts('a/b/c')).toEqual([
        { name: 'a', fullPath: 'a' },
        { name: 'b', fullPath: 'a/b' },
        { name: 'c', fullPath: 'a/b/c' },
      ])
    })
  })

  describe('hasAnyNestedFiles', () => {
    it('returns false for flat files', () => {
      expect(hasAnyNestedFiles([makeFile('a.txt'), makeFile('b.txt')])).toBe(false)
    })

    it('returns true when any file has a slash', () => {
      expect(hasAnyNestedFiles([makeFile('a.txt'), makeFile('dir/b.txt')])).toBe(true)
    })

    it('returns false for empty array', () => {
      expect(hasAnyNestedFiles([])).toBe(false)
    })
  })

  describe('collectAllFileNames', () => {
    it('collects all file names recursively', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c/d.txt'), makeFile('e.txt')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(collectAllFileNames(aNode).sort()).toEqual(['a/b.txt', 'a/c/d.txt'])
    })
  })

  describe('buildFolderSearchableText', () => {
    it('matches a file name within a folder', () => {
      const tree = buildFileTree([makeFile('folder/file.txt')])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const text = buildFolderSearchableText(folder)
      expect(text.toLowerCase().includes('file.txt')).toBe(true)
    })

    it('does not match across name boundaries', () => {
      const tree = buildFileTree([makeFile('folder/a.txt'), makeFile('folder/b.json')])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const text = buildFolderSearchableText(folder)
      expect(text.toLowerCase().includes('txt b')).toBe(false)
    })

    it('does not match trailing space queries', () => {
      const tree = buildFileTree([makeFile('folder/file.txt'), makeFile('folder/another.bin')])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const text = buildFolderSearchableText(folder)
      expect(text.toLowerCase().includes('file.txt ')).toBe(false)
    })

    it('matches partial file names', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const folder = tree.children.find((c) => c.name === 'weights')!
      const text = buildFolderSearchableText(folder)
      expect(text.toLowerCase().includes('model')).toBe(true)
    })

    it('matches the folder name itself', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const folder = tree.children.find((c) => c.name === 'weights')!
      const text = buildFolderSearchableText(folder)
      expect(text.toLowerCase().includes('weights')).toBe(true)
    })
  })

  describe('getFolderDates', () => {
    it('returns earliest createdAt and latest updatedAt from nested files', () => {
      const early = new Date('2024-01-01')
      const mid = new Date('2024-06-01')
      const late = new Date('2024-12-01')
      const tree = buildFileTree([
        makeFile('folder/a.txt', { createdAt: mid, updatedAt: early }),
        makeFile('folder/b.txt', { createdAt: early, updatedAt: late }),
        makeFile('folder/c.txt', { createdAt: late, updatedAt: mid }),
      ])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const dates = getFolderDates(folder)
      expect(dates.createdAt).toEqual(early)
      expect(dates.updatedAt).toEqual(late)
    })

    it('returns real file dates for a nested folder', () => {
      const tree = buildFileTree([makeFile('folder/sub/file.txt')])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const sub = folder.children.find((c) => c.name === 'sub')!
      // 'folder' has a nested file but 'sub' owns it - test getFolderDates on a
      // hypothetical empty node by removing children temporarily isn't practical,
      // so we verify the sub folder uses real file dates instead
      const dates = getFolderDates(sub)
      expect(dates.createdAt.getTime()).toBeGreaterThan(0)
    })

    it('considers deeply nested files', () => {
      const earliest = new Date('2023-01-01')
      const latest = new Date('2025-01-01')
      const tree = buildFileTree([
        makeFile('folder/a.txt', { createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }),
        makeFile('folder/sub/deep.txt', { createdAt: earliest, updatedAt: latest }),
      ])
      const folder = tree.children.find((c) => c.name === 'folder')!
      const dates = getFolderDates(folder)
      expect(dates.createdAt).toEqual(earliest)
      expect(dates.updatedAt).toEqual(latest)
    })
  })

  describe('countMatchingFiles', () => {
    it('returns total count when no query', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c.json')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, '')).toBe(2)
    })

    it('counts only matching files', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c.json'), makeFile('a/d.txt')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, '.txt')).toBe(2)
    })

    it('search is case-insensitive', () => {
      const tree = buildFileTree([makeFile('a/Model.BIN'), makeFile('a/readme.md')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, 'model')).toBe(1)
    })
  })

  describe('detectFileConflicts', () => {
    function makeUpload(name: string, uploadPath?: string): FileUploadWithMetadata {
      return {
        file: new File(['content'], name),
        uploadPath,
        relativePath: uploadPath || name,
      }
    }

    it('detects conflicts when upload name matches existing file', () => {
      const existing = [makeFile('model.bin'), makeFile('config.json')]
      const uploads = [makeUpload('model.bin', 'model.bin')]
      const { conflicts, nonConflicting } = detectFileConflicts(uploads, existing)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].existingFile.name).toBe('model.bin')
      expect(nonConflicting).toHaveLength(0)
    })

    it('returns non-conflicting files separately', () => {
      const existing = [makeFile('model.bin')]
      const uploads = [makeUpload('model.bin', 'model.bin'), makeUpload('readme.md', 'readme.md')]
      const { conflicts, nonConflicting } = detectFileConflicts(uploads, existing)
      expect(conflicts).toHaveLength(1)
      expect(nonConflicting).toHaveLength(1)
      expect(nonConflicting[0].file.name).toBe('readme.md')
    })

    it('detects conflicts with nested paths', () => {
      const existing = [makeFile('weights/model.bin')]
      const uploads = [makeUpload('model.bin', 'weights/model.bin')]
      const { conflicts } = detectFileConflicts(uploads, existing)
      expect(conflicts).toHaveLength(1)
    })

    it('returns no conflicts when no matches', () => {
      const existing = [makeFile('model.bin')]
      const uploads = [makeUpload('config.json', 'config.json')]
      const { conflicts, nonConflicting } = detectFileConflicts(uploads, existing)
      expect(conflicts).toHaveLength(0)
      expect(nonConflicting).toHaveLength(1)
    })

    it('handles empty existing files', () => {
      const uploads = [makeUpload('model.bin', 'model.bin')]
      const { conflicts, nonConflicting } = detectFileConflicts(uploads, [])
      expect(conflicts).toHaveLength(0)
      expect(nonConflicting).toHaveLength(1)
    })

    it('handles empty uploads', () => {
      const existing = [makeFile('model.bin')]
      const { conflicts, nonConflicting } = detectFileConflicts([], existing)
      expect(conflicts).toHaveLength(0)
      expect(nonConflicting).toHaveLength(0)
    })

    it('uses file.name as fallback when uploadPath is not set', () => {
      const existing = [makeFile('photo.png')]
      const uploads = [makeUpload('photo.png')]
      const { conflicts } = detectFileConflicts(uploads, existing)
      expect(conflicts).toHaveLength(1)
    })
  })

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

  describe('joinUploadPath', () => {
    it('returns the relative path unchanged when uploading to the model root', () => {
      expect(joinUploadPath('', 'weights/model.bin')).toBe('weights/model.bin')
    })

    it('prefixes the relative path with the destination folder', () => {
      expect(joinUploadPath('models/v2', 'weights/model.bin')).toBe('models/v2/weights/model.bin')
    })
  })

  describe('getFileUploadName', () => {
    it('returns the file name for a single uploaded file', () => {
      expect(getFileUploadName(new File(['content'], 'model.bin'))).toBe('model.bin')
    })

    it('returns the relative path for a file uploaded as part of a folder', () => {
      const file = new File(['content'], 'model.bin')
      Object.defineProperty(file, 'webkitRelativePath', { value: 'weights/model.bin' })
      expect(getFileUploadName(file)).toBe('weights/model.bin')
    })

    it('returns the name for an existing file', () => {
      expect(getFileUploadName(makeFile('weights/model.bin'))).toBe('weights/model.bin')
    })
  })
})
