import { FlattenedModelImage, ReviewResponse } from './interfaces'

export interface BailoError extends Error {
  id?: string
  documentationUrl?: string
}

export enum EntityKind {
  USER = 'user',
}

export interface Entity {
  kind: EntityKind
  id: string
  data?: unknown
}

export interface UiConfig {
  banner: {
    enabled: boolean
    text: string
    colour: string
    textColor: string
  }

  issues: {
    label: string
    supportHref: string
    contactHref: string
  }

  registry: {
    host: string
  }

  development: {
    logUrl: string
  }
}

export interface FileInterface {
  _id: string
  modelId: string

  name: string
  size: number
  mime: string

  bucket: string
  path: string

  complete: boolean

  createdAt: Date
  updatedAt: Date
}

export type ReviewComment = {
  message: string
  user: string
  createdAt: string
}

export type ReviewResponseKind = ReviewComment | ReviewResponse

export function isReviewResponse(responseKind: ReviewResponseKind) {
  return 'decision' in responseKind
}

export type ReleaseInterface = {
  modelId: string
  modelCardVersion: number
  semver: string
  notes: string
  minor?: boolean
  draft?: boolean
  fileIds: Array<string>
  comments: Array<ReviewComment>
  files: Array<FileInterface>
  images: Array<FlattenedModelImage>
  deleted: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ListModelType = 'favourites' | 'user' | 'all'

export interface SchemaInterface {
  id: string
  name: string
  description: string
  active: boolean
  hidden: boolean
  kind: SchemaKindKeys
  meta: unknown
  uiSchema: unknown
  schema: unknown
  createdAt: Date
  updatedAt: Date
}

export interface ModelCardRevisionInterface {
  modelId: string
  schemaId: string
  version: number
  metadata: unknown
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  short?: string
}

export const SchemaKind = {
  Model: 'model',
  AccessRequest: 'accessRequest',
} as const

export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export interface FileInterface {
  _id: string
  modelId: string

  name: string
  size: number
  mime: string

  bucket: string
  path: string

  complete: boolean

  createdAt: Date
  updatedAt: Date
}

export const isFileInterface = (file: File | FileInterface): file is FileInterface => {
  return (file as FileInterface).bucket !== undefined
}

export interface PostSimpleUpload {
  file: FileInterface
}

export interface User {
  dn: string
}

export interface EntityObject {
  kind: string
  id: string
}

export const TokenScope = {
  All: 'all',
  Models: 'models',
} as const

export type TokenScopeKeys = (typeof TokenScope)[keyof typeof TokenScope]

export const TokenActions = {
  ImageRead: 'image:read',
  FileRead: 'file:read',
} as const

export type TokenActionsKeys = (typeof TokenActions)[keyof typeof TokenActions]

export interface TokenInterface {
  user: string
  description: string
  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<TokenActionsKeys>
  accessKey: string
  secretKey?: string
  deleted: boolean
  createdAt: string
  updatedAt: string
  compareToken: (candidateToken: string) => Promise<boolean>
}
