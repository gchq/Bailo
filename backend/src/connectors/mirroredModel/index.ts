import { DocumentsMirrorMetadata, MongoDocumentMirrorInformation } from './importers/documents.js'
import { FileMirrorInformation, FileMirrorMetadata } from './importers/file.js'
import { ImageMirrorInformation, ImageMirrorMetadata } from './importers/image.js'

export const MirrorKind = {
  Documents: 'documents',
  File: 'file',
  Image: 'image',
} as const

export type MirrorKindKeys<T extends keyof typeof MirrorKind | void = void> = T extends keyof typeof MirrorKind
  ? (typeof MirrorKind)[T]
  : (typeof MirrorKind)[keyof typeof MirrorKind]

export type MirrorMetadata = DocumentsMirrorMetadata | FileMirrorMetadata | ImageMirrorMetadata
export type MirrorInformation = MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation
