export const SchemaKind = {
  All: '',
  Model: 'model',
  AccessRequest: 'accessRequest',
  DataCard: 'dataCard',
} as const
export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export const ReviewKind = {
  Release: 'release',
  Access: 'access',
} as const
export type ReviewKindKeys = (typeof ReviewKind)[keyof typeof ReviewKind]

export const GetModelCardVersionOptions = {
  Latest: 'latest',
} as const
export type GetModelCardVersionOptionsKeys =
  (typeof GetModelCardVersionOptions)[keyof typeof GetModelCardVersionOptions]

export const SchemaMigrationKind = {
  Move: 'move',
  Delete: 'delete',
} as const
export type SchemaMigrationKindKeys = (typeof SchemaMigrationKind)[keyof typeof SchemaMigrationKind]

export const HttpHeader = {
  CONTENT_TYPE: 'Content-Type',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CONTENT_LENGTH: 'Content-Length',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  ACCEPT_RANGES: 'Accept-Ranges',
  CONTENT_RANGE: 'Content-Range',
  IF_NONE_MATCH: 'If-None-Match',
}
