import { isValidObjectId } from 'mongoose'

import { FileWithScanResultsInterface } from '../models/File.js'

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
