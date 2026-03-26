import { HydratedDocument, isValidObjectId } from 'mongoose'

import { FileHydrated } from '../models/File.js'

export function isFileHydrated(data: unknown): data is FileHydrated {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (
    !('modelId' in data) ||
    !('name' in data) ||
    !('size' in data) ||
    !('mime' in data) ||
    !('path' in data) ||
    !('complete' in data) ||
    !('deleted' in data) ||
    !('createdAt' in data) ||
    !('updatedAt' in data) ||
    !('_id' in data)
  ) {
    return false
  }
  return isHydratedMongoDoc(data)
}

export function isHydratedMongoDoc<T>(value: unknown): value is HydratedDocument<T> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const doc = value as any

  return (
    typeof doc.$isNew === 'boolean' &&
    typeof doc.$get === 'function' &&
    typeof doc.toObject === 'function' &&
    isValidObjectId(doc._id)
  )
}

export const createFilePath = (modelId: string, fileId: string) => {
  return `beta/model/${modelId}/files/${fileId}`
}
