import { ProxyAgentOptions } from 'proxy-agent'
import { Optional } from 'utility-types'
import z, { ZodSchema, ZodTypeDef } from 'zod'

import { PeerKindKeys } from '../connectors/peer/index.js'
import { CollaboratorEntry, EntryKind, EntryKindKeys, EntryVisibilityKeys, SystemRolesKeys } from '../models/Model.js'
import {
  DocumentsMirrorMetadata,
  MongoDocumentMirrorInformation,
} from '../services/mirroredModel/importers/documents.js'
import { FileMirrorInformation, FileMirrorMetadata } from '../services/mirroredModel/importers/file.js'
import { ImageMirrorInformation, ImageMirrorMetadata } from '../services/mirroredModel/importers/image.js'
import { coerceArray, strictCoerceBoolean } from '../utils/validate.js'
import { BailoError } from './error.js'

export type PartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: PartialDeep<T[P]>
    }
  : T

export const RoleKind = {
  SYSTEM: 'system',
  REVIEW: 'review',
} as const

export enum EntityKind {
  USER = 'user',
  GROUP = 'group',
}

export type RoleKindKeys = (typeof RoleKind)[keyof typeof RoleKind]

export interface Role {
  name: string
  kind: RoleKindKeys
  shortName: string
  description?: string
  systemRole?: SystemRolesKeys
}

export type PermissionDetail =
  | {
      hasPermission: true
      info?: never
    }
  | {
      hasPermission: false
      info: string
    }

export interface EntryUserPermissions {
  editEntry: PermissionDetail
  editEntryCard: PermissionDetail

  createRelease: PermissionDetail
  editRelease: PermissionDetail
  deleteRelease: PermissionDetail

  pushModelImage: PermissionDetail

  createInferenceService: PermissionDetail
  editInferenceService: PermissionDetail

  exportMirroredModel: PermissionDetail
}

export interface AccessRequestUserPermissions {
  editAccessRequest: PermissionDetail
  deleteAccessRequest: PermissionDetail
}

export const FederationState = {
  DISABLED: 'disabled',
  READ_ONLY: 'readOnly',
  ENABLED: 'enabled',
} as const

export type FederationStateKeys = (typeof FederationState)[keyof typeof FederationState]

export interface RemoteFederationConfig {
  state: FederationStateKeys
  baseUrl: string
  label: string
  kind: PeerKindKeys
  proxy?: string
  httpConfig?: ProxyAgentOptions
  cache?: {
    query?: number
  }
  extra?: {
    [key: string]: any
  }
}

export type FederationStatus = {
  state: FederationStateKeys
  id?: string
}

export type SystemStatus = {
  ping: 'pong' | ''
  federation?: FederationStatus
  error?: BailoError
}

export type PeerConfigStatus = {
  config: RemoteFederationConfig
  status: SystemStatus
}

export interface UiConfig {
  banner: {
    enabled: boolean
    text: string
    colour: string
  }

  issues: {
    label: string
    supportHref: string
    contactHref: string
  }

  registry: {
    host: string
  }

  modelMirror: {
    import: {
      enabled: boolean
    }
    export: {
      enabled: boolean
      disclaimer: string
    }
  }

  inference: {
    enabled: boolean
    connection: {
      host: string
    }
    authorizationTokenName: string
    gpus: { [key: string]: string }
  }

  announcement: {
    enabled: boolean
    text: string
    startTimestamp: string
  }

  helpPopoverText: {
    manualEntryAccess: string
  }

  modelDetails: {
    organisations: string[]
    states: string[]
  }

  roleDisplayNames: {
    owner: string
    contributor: string
    consumer: string
  }
}

export interface EntrySearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
  kind: EntryKindKeys
  organisation?: string
  state?: string
  collaborators: Array<CollaboratorEntry>
  visibility: EntryVisibilityKeys
  createdAt: Date
  updatedAt: Date
  peerId?: string
  sourceModelId?: string
}

export interface EntrySearchResultWithErrors {
  // Todo: Update models to 'entries'
  models: Array<EntrySearchResult>
  errors?: Record<string, BailoError>
}

export interface EntrySearchOptions {
  kind: EntryKindKeys
  libraries: Array<string>
  organisations: Array<string>
  states: Array<string>
  filters: Array<string>
  search: string
  task: string
  peers: Array<string>
  allowTemplating: boolean
  schemaId: string
  adminAccess: boolean
}

export type EntrySearchOptionsParams = Optional<EntrySearchOptions>

export const EntrySearchOptionsSchema: ZodSchema<EntrySearchOptionsParams, ZodTypeDef, unknown> = z.object({
  kind: z.nativeEnum(EntryKind).optional(),
  task: z.string().optional(),
  libraries: coerceArray(z.array(z.string()).optional()),
  organisations: coerceArray(z.array(z.string()).optional()),
  states: coerceArray(z.array(z.string()).optional()),
  filters: coerceArray(z.array(z.string()).optional()),
  search: z.string().optional(),
  allowTemplating: strictCoerceBoolean(z.boolean().optional()),
  schemaId: z.string().optional(),
  adminAccess: strictCoerceBoolean(z.boolean().optional()),
  peers: coerceArray(z.array(z.string()).optional()),
})

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

export type MirrorExportLogData = Record<string, unknown> & { exportId: string }
export type MirrorImportLogData = Record<string, unknown> & { importId: string }
