import type { ZodType } from 'zod'

import { type ArtefactScanStateKeys } from '../connectors/artefactScanning/Base.js'
import { type PeerKindKeys } from '../connectors/peer/index.js'
import { z } from '../lib/zod.js'
import {
  type CollaboratorEntry,
  EntryKind,
  type EntryKindKeys,
  EntryVisibility,
  type EntryVisibilityKeys,
  type SystemRolesKeys,
} from '../models/Model.js'
import { type ScanInterface, type SeverityLevelKeys } from '../models/Scan.js'
import { type HttpsDispatcherOptions } from '../services/http.js'
import {
  type DocumentsMirrorMetadata,
  type MongoDocumentMirrorInformation,
} from '../services/mirroredModel/importers/documents.js'
import { type FileMirrorInformation, type FileMirrorMetadata } from '../services/mirroredModel/importers/file.js'
import { type ImageMirrorInformation, type ImageMirrorMetadata } from '../services/mirroredModel/importers/image.js'
import { getEnumValues } from '../utils/enum.js'
import { coerceArray, strictCoerceBoolean } from '../utils/validate.js'
import { type BailoError } from './error.js'

/** Makes the keys `K` of `T` optional, or every key when `K` is omitted. */
export type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>

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

export interface DeploymentAssessmentUserPermissions {
  editDeploymentAssessment: PermissionDetail
  deleteDeploymentAssessment: PermissionDetail
}

/**
 * The possible federation states, used for both the instance (`federation.state`) and each peer
 * (`federation.peers.<id>.state`).
 *
 * - `DISABLED` - Federation is off and no peer connections are created
 * - `READ_ONLY` - Peer connections are created. Currently behaves the same as `ENABLED`
 * - `ENABLED` - Peer connections are created
 *
 * This only controls outgoing connections. It does not stop other instances from querying this instance.
 */
export const FederationState = {
  DISABLED: 'disabled',
  READ_ONLY: 'readOnly',
  ENABLED: 'enabled',
} as const

/** The string values of FederationState: `'disabled' | 'readOnly' | 'enabled'` */
export type FederationStateKeys = (typeof FederationState)[keyof typeof FederationState]

/**
 * Configuration for a single federation peer, i.e. a value in `federation.peers`. Its key in `federation.peers` is the
 * peer's ID, which is shown to users in the Marketplace **External repositories** filter.
 *
 * @example
 * ```js
 * // Another Bailo instance
 * {
 *   state: 'enabled',
 *   kind: 'bailo',
 *   baseUrl: 'https://bailo.organisation-b.example',
 *   label: 'Organisation B',
 * }
 *
 * // Hugging Face Hub
 * {
 *   state: 'enabled',
 *   kind: 'huggingfacehub',
 *   baseUrl: 'https://huggingface.co',
 *   label: 'Hugging Face',
 *   cache: { query: 60 },
 *   extra: { statusModelName: 'openai/whisper-large-v3', statusModelId: '654a84cadff2f49007ce6c37' },
 * }
 * ```
 */
export interface RemoteFederationConfig {
  /** State of this peer (required).
   *
   * A 'disabled' Bailo peer is not checked for reachability, but is still listed to users. Remove it from
   * `federation.peers` to hide it.
   */
  state: FederationStateKeys
  /** Public URL of the peer (required), without a trailing slash or `/api`
   *
   * Used for backend requests to the peer and for the links users follow to view remote models.
   */
  baseUrl: string
  /** Human-readable name for the peer (required). Not currently shown in the UI, which displays the peer's ID */
  label: string
  /** The type of peer (required)
   * - 'bailo' - Another Bailo instance
   * - 'huggingfacehub' - The public Hugging Face Hub. Only supports plain text searches of at least five characters
   *   for models, and requires `extra`
   */
  kind: PeerKindKeys
  /** `http(s)://` proxy URL for requests to this peer. PAC files are not supported.
   *
   * When omitted, the `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables are used instead.
   */
  proxy?: string
  /** TLS options for requests to this peer, e.g. `ca` to trust a private certificate authority, or `cert` and `key`
   * for a client certificate. Merged over `httpClient.defaultOpts`
   */
  httpConfig?: HttpsDispatcherOptions
  /** Caching of search results from this peer. Only used by Hugging Face Hub peers */
  cache?: {
    /** Time to live in seconds. Caching is off when unset */
    query?: number
  }
  /** Additional settings specific to the peer `kind`
   *
   * Required for 'huggingfacehub' peers, where reachability is checked by looking up a known model:
   * - `statusModelName` - Name of the model to look up, e.g. `'openai/whisper-large-v3'`
   * - `statusModelId` - The expected ID of that model
   */
  extra?: {
    [key: string]: any
  }
  /** Service identities this peer is allowed to escalate from
   *
   * Only used when `federation.isEscalationEnabled` is set. Requests from this peer authenticated as one of these
   * identities are run as the user the peer sends. The peer's key in `federation.peers` must match its `federation.id`.
   */
  allowedSystemUserIds?: string[]
}

/** Federation details of an instance, as reported by `GET /api/v2/system/status` */
export type FederationStatus = {
  /** The instance's configured `federation.state` */
  state: FederationStateKeys
  /** The instance's configured `federation.id` */
  id?: string
}

/** Status of an instance or peer, as returned by the system status endpoints */
export type SystemStatus = {
  /** 'pong' if the instance or peer was reachable, otherwise an empty string */
  ping: 'pong' | ''
  /** Federation details. Only reported by Bailo instances */
  federation?: FederationStatus
  /** Set if the status check failed or returned something unexpected */
  error?: BailoError
}

/** A configured peer and its current status, as returned by `GET /api/v2/system/peers` */
export type PeerConfigStatus = {
  /** The peer's configuration */
  config: RemoteFederationConfig
  /** The result of the latest status check against the peer */
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

  /** ### SyOps
   * Optional link to the SyOps system, shown in the user settings menu when enabled
   */
  syOps: {
    /** Show the SyOps link */
    enabled: boolean
    /** URL of the SyOps system */
    href: string
  }

  christmas: {
    /** Enable Christmas decorations during December */
    enabled: boolean
  }

  modelMirror: {
    import: {
      /** Available to import models */
      enabled: boolean
      additionalInfoHeading: string
      originalAnswerHeading: string
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
    /** Heading of the announcement, defaults to "Announcement" */
    title?: string
    /** Announcement text to appear at the top of the screen */
    text: string
    /** Longer markdown description shown when the user selects "Show more" */
    description?: string
    /** timestamp to start displaying the announcement. Uses standard Date object */
    startTimestamp: number | string
    /** Colour scheme of the announcement, taken from the theme palette */
    severity?: 'info' | 'warning' | 'error'
    /** Links shown as buttons on the announcement, e.g. release notes or docs */
    links?: { label: string; href: string }[]
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

  untrustedModel: {
    enabled: boolean
    untrustedModelLongDescription: string
    untrustedModelShortDescription: string
    fileUploadGuidance: string
  }

  llmImport: {
    enabled: boolean
  }

  deploymentAssessments: {
    /** Only models in this state can be included in a Deployment Assessment. Set to null to allow any state */
    deployableModelState: string | null
  }

  lifecycle: {
    maxReviewInterval: string
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
  kind: Array<EntryKindKeys>
  libraries: Array<string>
  organisations: Array<string>
  states: Array<string>
  filters: Array<string>
  search: string
  task: string
  peers: Array<string>
  users: Array<string>
  allowTemplating: boolean
  schemaId: string
  adminAccess: boolean
  titleOnly: boolean
  visibility: EntryVisibilityKeys
}

export type EntrySearchOptionsParams = Optional<EntrySearchOptions>

export const EntrySearchOptionsSchema: ZodType<EntrySearchOptionsParams, unknown> = z.object({
  kind: coerceArray(z.array(z.enum(EntryKind))).optional(),
  task: z.string().toLowerCase().optional(),
  libraries: coerceArray(z.array(z.string().toLowerCase())).optional(),
  organisations: coerceArray(z.array(z.string())).optional(),
  states: coerceArray(z.array(z.string())).optional(),
  filters: coerceArray(z.array(z.string())).optional(),
  users: coerceArray(z.array(z.string())).optional(),
  search: z.string().optional(),
  allowTemplating: strictCoerceBoolean(z.boolean()).optional(),
  schemaId: z.string().optional(),
  adminAccess: strictCoerceBoolean(z.boolean()).optional(),
  peers: coerceArray(z.array(z.string())).optional(),
  titleOnly: strictCoerceBoolean(z.boolean()).optional(),
  visibility: z.enum(EntryVisibility).optional(),
})

export const EntryFilter = {
  WITH: 'with',
  WITHOUT: 'without',
} as const

export interface MetricsEntrySearchOptions {
  organisation: string
  state: string
  schemaId: string
  kinds: Array<EntryKindKeys>
  release: string
  accessRequest: string
  startMonth: string
  endMonth: string
}

export type MetricsEntrySearchOptionsParams = Optional<MetricsEntrySearchOptions>

export const MetricsEntrySearchOptionsSchema: ZodType<MetricsEntrySearchOptionsParams, unknown> = z.object({
  organisation: z.string().optional(),
  state: z.string().optional(),
  schemaId: z.string().optional(),
  kinds: coerceArray(z.array(z.enum(EntryKind))).optional(),
  release: z.enum(getEnumValues(EntryFilter)).optional(),
  accessRequest: z.enum(getEnumValues(EntryFilter)).optional(),
  startMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  endMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
})

export type ModelImages = ModelImageTags[]
export type LayerScanSummary = Pick<
  ScanInterface,
  'toolName' | 'scannerVersion' | 'state' | 'summary' | 'lastRunAt'
> & { layerDigest: string }
export type ModelImageTags = {
  repository: string
  name: string
  tags: Array<string>
}

export type ImageScanResult = {
  state: ArtefactScanStateKeys
  severityCounts: SeverityCounts
  scanResults?: ScanInterface[]
  imageSize: number
}

export type ImageTagResult = {
  tag: string
  digest: string
  platform?: string
} & ImageScanResult

export type ImageScanResults = {
  scanSummaries: ImageTagResult[]
}

export type ModelImagesWithScanResults = ModelImageTags & ImageScanResults

export type SeverityCounts = Record<SeverityLevelKeys, number>
export type ArtefactScanStateCounts = Record<ArtefactScanStateKeys, number>

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

export type MirrorExportLogData = Record<string, unknown> & { exportId: string; semvers?: string[] }
export type MirrorImportLogData = Record<string, unknown> & { importId: string }

export const isMongoDocumentMirrorInformation = (
  value: MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation,
): value is MongoDocumentMirrorInformation => {
  return !!(value as MongoDocumentMirrorInformation).newModelCards
}

export const isFileMirrorInformation = (
  value: MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation,
): value is FileMirrorInformation => {
  return !!(value as FileMirrorInformation).newPath
}
