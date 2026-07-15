import { isValidObjectId } from 'mongoose'

import { FileWithScanResultsInterface } from '../models/File.js'
import { BadReq } from './error.js'

export function isFileWithScanResultsInterface(data: unknown): data is FileWithScanResultsInterface {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (
    !('_id' in data) ||
    !('modelId' in data) ||
    !('name' in data) ||
    !('size' in data) ||
    !('mime' in data) ||
    !('path' in data) ||
    !('complete' in data) ||
    !('tags' in data) ||
    !('createdAt' in data) ||
    !('updatedAt' in data) ||
    !('id' in data) ||
    !('scanResults' in data) ||
    !('deleted' in data) ||
    !('deletedAt' in data) ||
    !('deletedBy' in data)
  ) {
    return false
  }
  return isValidObjectId(data._id)
}

export const createFilePath = (modelId: string, fileId: string) => {
  return `beta/model/${modelId}/files/${fileId}`
}

export function validateFileName(name: string): string {
  const trimmed = name.trim()

  if (!trimmed) {
    throw BadReq('File name must not be empty.')
  }

  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    throw BadReq('File name must not start or end with a slash.', { name })
  }

  if (trimmed.includes('\\')) {
    throw BadReq('File name must not contain backslashes.', { name })
  }

  if (trimmed.includes('\0')) {
    throw BadReq('File name must not contain null bytes.', { name })
  }

  const segments = trimmed.split('/')
  for (const segment of segments) {
    if (!segment) {
      throw BadReq('File name must not contain empty path segments.', { name })
    }
    if (segment === '.' || segment === '..') {
      throw BadReq('File name must not contain path traversal segments.', { name })
    }
  }

  return trimmed
}

export function getFileDirectory(name: string): string {
  const lastSlash = name.lastIndexOf('/')
  return lastSlash === -1 ? '' : name.substring(0, lastSlash)
}

export function getFileBaseName(name: string): string {
  const lastSlash = name.lastIndexOf('/')
  return lastSlash === -1 ? name : name.substring(lastSlash + 1)
}
