import { FileInterface } from 'types/types'

export interface FileTreeNode {
  name: string
  fullPath: string
  isDirectory: boolean
  children: FileTreeNode[]
  file?: FileInterface
  totalFileCount: number
}

export function getFileBaseName(name: string): string {
  const lastSlash = name.lastIndexOf('/')
  return lastSlash === -1 ? name : name.substring(lastSlash + 1)
}

/**
 * Converts a flat array of files into a tree structure by splitting each file's
 * name on '/' and creating intermediate directory nodes as needed. Files without
 * slashes in their name become direct children of the root node.
 */
export function buildFileTree(files: FileInterface[]): FileTreeNode {
  const root: FileTreeNode = {
    name: '',
    fullPath: '',
    isDirectory: true,
    children: [],
    totalFileCount: files.length,
  }

  for (const file of files) {
    const segments = file.name.split('/')
    let current = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const isLast = i === segments.length - 1
      const fullPath = segments.slice(0, i + 1).join('/')

      if (isLast) {
        // Leaf node: attach the actual file
        current.children.push({
          name: segment,
          fullPath,
          isDirectory: false,
          children: [],
          file,
          totalFileCount: 0,
        })
      } else {
        // Intermediate segment: find or create a directory node
        let dir = current.children.find((child) => child.isDirectory && child.name === segment)
        if (!dir) {
          dir = {
            name: segment,
            fullPath,
            isDirectory: true,
            children: [],
            totalFileCount: 0,
          }
          current.children.push(dir)
        }
        current = dir
      }
    }
  }

  // After building the tree, recursively compute how many files each directory contains
  computeFileCounts(root)
  return root
}

/** Recursively counts the total number of files (leaf nodes) under each directory. */
function computeFileCounts(node: FileTreeNode): number {
  if (!node.isDirectory) {
    return 1
  }
  let count = 0
  for (const child of node.children) {
    count += computeFileCounts(child)
  }
  node.totalFileCount = count
  return count
}

/** Navigates the tree to find the directory node at the given slash-delimited path. */
export function getNodeAtPath(root: FileTreeNode, path: string): FileTreeNode | undefined {
  if (!path) {
    return root
  }
  const segments = path.split('/')
  let current = root
  for (const segment of segments) {
    const child = current.children.find((c) => c.isDirectory && c.name === segment)
    if (!child) {
      return undefined
    }
    current = child
  }
  return current
}

/** Splits a path like "weights/subdir" into clickable breadcrumb segments with cumulative paths. */
export function getBreadcrumbParts(path: string): { name: string; fullPath: string }[] {
  if (!path) {
    return []
  }
  const segments = path.split('/')
  return segments.map((segment, i) => ({
    name: segment,
    fullPath: segments.slice(0, i + 1).join('/'),
  }))
}

/** Returns true if any file in the array has a slash in its name, indicating folder structure. */
export function hasAnyNestedFiles(files: FileInterface[]): boolean {
  return files.some((file) => file.name.includes('/'))
}

/** Collects all file names recursively under a tree node, for use as searchable text. */
export function collectAllFileNames(node: FileTreeNode): string[] {
  const names: string[] = []
  const collect = (n: FileTreeNode) => {
    if (!n.isDirectory && n.file) {
      names.push(n.file.name)
    }
    for (const child of n.children) {
      collect(child)
    }
  }
  collect(node)
  return names
}

/** Counts how many files under a tree node match a search query (case-insensitive). */
export function countMatchingFiles(node: FileTreeNode, query: string): number {
  if (!query) {
    return node.totalFileCount
  }
  const lowerQuery = query.toLowerCase()
  let count = 0
  const walk = (n: FileTreeNode) => {
    if (!n.isDirectory && n.file && n.file.name.toLowerCase().includes(lowerQuery)) {
      count++
    }
    for (const child of n.children) {
      walk(child)
    }
  }
  walk(node)
  return count
}
