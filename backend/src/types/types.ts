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
  /** Whether a peer is enabled */
  state: FederationStateKeys
  /** The url of the peer to communicate to */
  baseUrl: string
  /** Does nothing */
  label: string
  /** Either another Bailo instance or hugging face */
  kind: PeerKindKeys
  proxy?: string
  httpConfig?: ProxyAgentOptions
  /** Defines how long search requests should exist for */
  cache?: {
    /** Time to live in seconds */
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
  /** ### Banner
   * Viewable top level banner at the top of the window screen */
  banner: {
    /** Banner is enabled */
    enabled: boolean
    /** Banner text */
    text: string
    /** Banner colour */
    colour: string
  }
  /** ### Help Detail
   * Contact details for help page
   */
  issues: {
    /** If you have experienced any issues with Bailo, then please report it to the `blank`. */
    label: string
    /** Support contact email */
    supportHref: string
    /** Help contact email */
    contactHref: string
  }

  registry: {
    /** The host name of registry usually the domain name*/
    host: string
  }

  modelMirror: {
    import: {
      /** Available to import models */
      enabled: boolean
    }
    export: {
      /** Available to export models */
      enabled: boolean
      /** Message to display on export */
      disclaimer: string
    }
  }

  inference: {
    /** Enables frontend usage of inference spec */
    enabled: boolean
    /** Connection string to  */
    connection: {
      host: string
    }
    /** Token name */
    authorizationTokenName: string
    /** GPU limits avalible */
    gpus: { [key: string]: string }
  }

  announcement: {
    /** Announcement message to appear to the top of the screen */
    enabled: boolean
    /** Announcement text to appear at the top of the screen */
    text: string
    /** timestamp to start displaying the announcement. Uses standard Date object */
    startTimestamp: number | string
  }
  /** ### Help Pop over Text
   * Customisable text on frontend
   */
  helpPopoverText: {
    /** This text appears in under the "Manage Model Access" within each of the model settings */
    manualEntryAccess: string
  }

  /** ### Model Details
   *
   * Sets of customisable tags on the marketplace for discoverability
   *
   */
  modelDetails: {
    /** Organisation a model can belong to */
    organisations: string[]
    /** Status of Lifecycle */
    states: string[]
  }

  /** ### Role Display Names
   *
   * Frontend appearance for user roles on the frontend.
   */
  roleDisplayNames: {
    /** This role includes all permissions, such as managing model access and model deletion */
    owner: string
    /** This role allows users edit the model card and draft releases */
    contributor: string
    /** This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests */
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
  titleOnly: boolean
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
  titleOnly: strictCoerceBoolean(z.boolean().optional()),
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
