import { FileInterface, FileUploadWithMetadata } from 'types/types'

export function getFileUploadName(file: File | FileInterface): string {
  if (file instanceof File && file.webkitRelativePath) {
    return file.webkitRelativePath
  }
  return file.name
}

export function isFolderMarker(file: FileInterface): boolean {
  return file.name.endsWith('/.folder')
}

export interface FileTreeNode {
  name: string
  fullPath: string
  isDirectory: boolean
  children: FileTreeNode[]
  file?: FileInterface
  // The ".folder" marker file for this directory, if one was uploaded (e.g. for empty folders).
  // Preserved so that getFolderDates can fall back to the marker's timestamps when the folder has no real files.
  markerFile?: FileInterface
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
  const realFiles = files.filter((f) => !isFolderMarker(f))
  const root: FileTreeNode = {
    name: '',
    fullPath: '',
    isDirectory: true,
    children: [],
    totalFileCount: realFiles.length,
  }

  for (const file of files) {
    const segments = file.name.split('/').filter((s) => s !== '')
    if (segments.length === 0) {
      continue
    }
    let current = root

    if (isFolderMarker(file)) {
      // Folder marker (e.g. "path/to/dir/.folder"): create directory nodes but skip the .folder leaf.
      // The marker's metadata is stored on the deepest directory node so getFolderDates can use its
      // timestamps as a fallback when the folder contains no real files.
      const dirSegments = segments.slice(0, -1)
      for (let i = 0; i < dirSegments.length; i++) {
        const segment = dirSegments[i]
        const fullPath = dirSegments.slice(0, i + 1).join('/')
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
      current.markerFile = file
    } else {
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const isLast = i === segments.length - 1
        const fullPath = segments.slice(0, i + 1).join('/')

        if (isLast) {
          current.children.push({
            name: segment,
            fullPath,
            isDirectory: false,
            children: [],
            file,
            totalFileCount: 0,
          })
        } else {
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
  return files.some((file) => file.name.includes('/') || isFolderMarker(file))
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

/** Builds a searchable text string for a folder node by joining its name with all nested file names. */
export function buildFolderSearchableText(node: FileTreeNode): string {
  return [node.name, ...collectAllFileNames(node)].join('\n')
}

/**
 * Derives meaningful dates for a folder from its contents:
 *   - createdAt: earliest createdAt among all nested files (when the folder effectively came into being)
 *   - updatedAt: latest updatedAt among all nested files (when the folder's contents last changed)
 *
 * Falls back to the ".folder" marker file's timestamps for empty folders (created via "Create folder").
 * Returns epoch (1970-01-01) only if neither real files nor a marker exist.
 */
export function getFolderDates(node: FileTreeNode): { createdAt: Date; updatedAt: Date } {
  const files = collectAllFiles(node)
  if (files.length === 0) {
    if (node.markerFile) {
      return { createdAt: new Date(node.markerFile.createdAt), updatedAt: new Date(node.markerFile.updatedAt) }
    }
    return { createdAt: new Date(0), updatedAt: new Date(0) }
  }
  return {
    createdAt: new Date(Math.min(...files.map((f) => new Date(f.createdAt).getTime()))),
    updatedAt: new Date(Math.max(...files.map((f) => new Date(f.updatedAt).getTime()))),
  }
}

/** Collects all FileInterface objects recursively under a tree node. */
export function collectAllFiles(node: FileTreeNode): FileInterface[] {
  const files: FileInterface[] = []
  const collect = (n: FileTreeNode) => {
    if (!n.isDirectory && n.file) {
      files.push(n.file)
    }
    for (const child of n.children) {
      collect(child)
    }
  }
  collect(node)
  return files
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

export interface FileConflict {
  fileToUpload: FileUploadWithMetadata
  existingFile: FileInterface
}

/**
 * Compares staged upload file names against existing files to detect conflicts.
 * Folder markers (.folder) are excluded from conflict detection as they are structural, not user files.
 * Returns conflicts and non-conflicting files separately so the caller can prompt the user.
 */
export function detectFileConflicts(
  filesToUpload: FileUploadWithMetadata[],
  existingFiles: FileInterface[],
): { conflicts: FileConflict[]; nonConflicting: FileUploadWithMetadata[] } {
  const existingByName = new Map<string, FileInterface>()
  for (const file of existingFiles) {
    if (!isFolderMarker(file)) {
      existingByName.set(file.name, file)
    }
  }

  const conflicts: FileConflict[] = []
  const nonConflicting: FileUploadWithMetadata[] = []

  for (const fileToUpload of filesToUpload) {
    const uploadName = fileToUpload.uploadPath || fileToUpload.file.name
    const existing = existingByName.get(uploadName)
    if (existing) {
      conflicts.push({ fileToUpload, existingFile: existing })
    } else {
      nonConflicting.push(fileToUpload)
    }
  }

  return { conflicts, nonConflicting }
}
