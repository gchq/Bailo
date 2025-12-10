import { FileInterfaceDoc } from '../models/File.js'

export function isFileInterfaceDoc(data: unknown): data is FileInterfaceDoc {
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
  return true
}
export const createFilePath = (modelId: string, fileId: string) => {
  return `beta/model/${modelId}/files/${fileId}`
}
