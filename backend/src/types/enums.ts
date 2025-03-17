export const SchemaKind = {
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
