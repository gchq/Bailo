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

// HTTP headers
export const HttpHeader = {
  CONTENT_TYPE: 'Content-Type',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CONTENT_LENGTH: 'Content-Length',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  ACCEPT_RANGES: 'Accept-Ranges',
  CONTENT_RANGE: 'Content-Range',
}
