import { FileInterface } from 'types/types'
import { describe, expect, test } from 'vitest'

import {
  buildFileTree,
  collectAllFileNames,
  countMatchingFiles,
  getBreadcrumbParts,
  getFileBaseName,
  getNodeAtPath,
  hasAnyNestedFiles,
} from '../fileTreeUtils'

function makeFile(name: string): FileInterface {
  return {
    _id: name,
    modelId: 'model1',
    name,
    size: 100,
    mime: 'application/octet-stream',
    path: `beta/model/model1/files/${name}`,
    complete: true,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FileInterface
}

describe('utils > fileTreeUtils', () => {
  describe('getFileBaseName', () => {
    test('returns full name for flat file', () => {
      expect(getFileBaseName('model.bin')).toBe('model.bin')
    })

    test('returns basename for nested path', () => {
      expect(getFileBaseName('weights/subdir/model.bin')).toBe('model.bin')
    })
  })

  describe('buildFileTree', () => {
    test('builds tree from flat files', () => {
      const files = [makeFile('a.txt'), makeFile('b.txt')]
      const tree = buildFileTree(files)

      expect(tree.children).toHaveLength(2)
      expect(tree.children[0].isDirectory).toBe(false)
      expect(tree.children[0].name).toBe('a.txt')
      expect(tree.totalFileCount).toBe(2)
    })

    test('builds tree from nested files', () => {
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

    test('builds deeply nested tree', () => {
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

    test('returns empty tree for empty files', () => {
      const tree = buildFileTree([])
      expect(tree.children).toHaveLength(0)
      expect(tree.totalFileCount).toBe(0)
    })
  })

  describe('getNodeAtPath', () => {
    test('returns root for empty path', () => {
      const tree = buildFileTree([makeFile('a.txt')])
      const node = getNodeAtPath(tree, '')
      expect(node).toBe(tree)
    })

    test('returns directory node at path', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const node = getNodeAtPath(tree, 'weights')
      expect(node).toBeDefined()
      expect(node!.name).toBe('weights')
      expect(node!.children).toHaveLength(1)
    })

    test('returns undefined for non-existent path', () => {
      const tree = buildFileTree([makeFile('weights/model.bin')])
      const node = getNodeAtPath(tree, 'config')
      expect(node).toBeUndefined()
    })
  })

  describe('getBreadcrumbParts', () => {
    test('returns empty array for empty path', () => {
      expect(getBreadcrumbParts('')).toEqual([])
    })

    test('returns single segment', () => {
      expect(getBreadcrumbParts('weights')).toEqual([{ name: 'weights', fullPath: 'weights' }])
    })

    test('returns cumulative path segments', () => {
      expect(getBreadcrumbParts('a/b/c')).toEqual([
        { name: 'a', fullPath: 'a' },
        { name: 'b', fullPath: 'a/b' },
        { name: 'c', fullPath: 'a/b/c' },
      ])
    })
  })

  describe('hasAnyNestedFiles', () => {
    test('returns false for flat files', () => {
      expect(hasAnyNestedFiles([makeFile('a.txt'), makeFile('b.txt')])).toBe(false)
    })

    test('returns true when any file has a slash', () => {
      expect(hasAnyNestedFiles([makeFile('a.txt'), makeFile('dir/b.txt')])).toBe(true)
    })

    test('returns false for empty array', () => {
      expect(hasAnyNestedFiles([])).toBe(false)
    })
  })

  describe('collectAllFileNames', () => {
    test('collects all file names recursively', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c/d.txt'), makeFile('e.txt')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(collectAllFileNames(aNode).sort()).toEqual(['a/b.txt', 'a/c/d.txt'])
    })
  })

  describe('countMatchingFiles', () => {
    test('returns total count when no query', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c.json')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, '')).toBe(2)
    })

    test('counts only matching files', () => {
      const tree = buildFileTree([makeFile('a/b.txt'), makeFile('a/c.json'), makeFile('a/d.txt')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, '.txt')).toBe(2)
    })

    test('search is case-insensitive', () => {
      const tree = buildFileTree([makeFile('a/Model.BIN'), makeFile('a/readme.md')])
      const aNode = tree.children.find((c) => c.name === 'a')!
      expect(countMatchingFiles(aNode, 'model')).toBe(1)
    })
  })
})
