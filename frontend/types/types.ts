import { UiSchema } from '@rjsf/utils'
import { Dispatch, SetStateAction } from 'react'

export interface BailoError extends Error {
  id?: string
  documentationUrl?: string
}
export enum EntityKind {
  USER = 'user',
  GROUP = 'group',
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
  inference: {
    enabled: boolean
    connection: {
      host: string
    }
    authorizationTokenName: string
    gpus: { [key: string]: string }
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

  // Older files may not have AV run against them
  avScan?: AvScanResult[]

  tags?: string[]

  createdAt: Date
  updatedAt: Date
}

export type FileWithScanResultsInterface = FileInterface & { avScan: ScanResultInterface[]; id: string }

export interface ScanResultInterface {
  _id: string
  state: ScanStateKeys
  scannerVersion?: string
  isInfected?: boolean
  viruses?: Array<string>
  toolName: string
  lastRunAt: string

  createdAt: Date
  updatedAt: Date
}

export const ScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Error: 'error',
} as const
export type ScanStateKeys = (typeof ScanState)[keyof typeof ScanState]

export type AvScanResult = ScanResultInterface &
  (
    | {
        artefactKind: typeof ArtefactKind.File
        fileId: string
      }
    | {
        artefactKind: typeof ArtefactKind.Image
        repositoryName: string
        imageDigest: string
        // TODO: ultimately use a mapped version of backend/src/models/Release.ts:ImageRef, but ImageRef needs converting to use Digest rather than Tag first
      }
  )

export const ArtefactKind = {
  File: 'file',
  Image: 'image',
} as const
export type ArtefactKindKeys = (typeof ArtefactKind)[keyof typeof ArtefactKind]

export const ResponseKind = {
  Review: 'review',
  Comment: 'comment',
} as const
export type ResponseKindKeys = (typeof ResponseKind)[keyof typeof ResponseKind]

export interface ResponseInterface {
  _id: string
  entity: string
  kind: ResponseKindKeys
  parentId: string
  outdated?: boolean
  decision?: DecisionKeys
  comment?: string
  role?: string
  reactions: ResponseReaction[]
  commentEditedAt?: string

  createdAt: string
  updatedAt: string
}

export interface ResponseReaction {
  kind: ReactionKindKeys
  users: string[]
}

export const ReactionKind = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  CELEBRATE: 'celebrate',
  HEART: 'heart',
} as const
export type ReactionKindKeys = (typeof ReactionKind)[keyof typeof ReactionKind]

export type ReleaseInterface = {
  _id: string
  modelId: string
  modelCardVersion: number
  semver: string
  notes: string
  minor?: boolean
  draft?: boolean
  fileIds: Array<string>
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

export interface EntryCardRevisionInterface {
  modelId: string
  schemaId: string
  version: number
  metadata: unknown
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const RoleKind = {
  ENTRY: 'entry',
  SCHEMA: 'schema',
} as const

export type RoleKindKeys = (typeof RoleKind)[keyof typeof RoleKind]

export interface Role {
  id: string
  name: string
  short?: string
  kind?: RoleKindKeys
  description?: string
}

export const SchemaKind = {
  MODEL: 'model',
  ACCESS_REQUEST: 'accessRequest',
  DATA_CARD: 'dataCard',
} as const

export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export const isSchemaKind = (value: unknown): value is SchemaKindKeys => {
  return Object.values(SchemaKind).includes(value as SchemaKindKeys)
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

export const isFileInterface = (file: File | FileInterface): file is FileInterface => {
  return (file as FileInterface).bucket !== undefined
}

export interface PostSimpleUpload {
  file: FileInterface
}

export interface User {
  dn: string
  isAdmin: boolean
}

export interface EntityObject {
  kind: string
  id: string
}

export interface TokenAction {
  id: string
  description: string
}

export const TokenScope = {
  All: 'all',
  Models: 'models',
} as const

export type TokenScopeKeys = (typeof TokenScope)[keyof typeof TokenScope]

export const TokenActionKind = {
  READ: 'read',
  WRITE: 'write',
}

export type TokenActionKindKeys = (typeof TokenActionKind)[keyof typeof TokenActionKind]

export const TokenCategory = {
  PERSONAL_ACCESS: 'personal access',
  KUBERNETES: 'kubernetes',
  ROCKET: 'rocket',
  PODMAN: 'podman',
  DOCKER_LOGIN: 'docker login',
  DOCKER_CONFIGURATION: 'docker configuration',
} as const

export type TokenCategoryKeys = (typeof TokenCategory)[keyof typeof TokenCategory]

export interface TokenInterface {
  user: string
  description: string
  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<string>
  accessKey: string
  secretKey: string
  deleted: boolean
  createdAt: string
  updatedAt: string
  compareToken: (candidateToken: string) => Promise<boolean>
}

export interface SplitSchema {
  reference: string

  steps: Array<Step>
}

export interface SplitSchemaNoRender {
  reference: string

  steps: Array<StepNoRender>
}

export interface RenderInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
}

export type StepType = 'Form' | 'Data' | 'Message'

export interface Step {
  schema: any
  uiSchema?: UiSchema

  state: any
  index: number

  steps?: Array<Step>

  type: StepType
  section: string
  schemaRef: string

  render: (RenderInterface) => JSX.Element | null
  renderBasic: (RenderInterface) => JSX.Element | null
  renderButtons: (RenderButtonsInterface) => JSX.Element | null

  shouldValidate: boolean
  isComplete: (step: Step) => boolean
}

export interface StepNoRender {
  schema: any
  uiSchema?: UiSchema

  state: any
  index: number

  steps?: Array<StepNoRender>

  type: StepType
  section: string
  schemaRef: string

  shouldValidate: boolean
  isComplete: (step: StepNoRender) => boolean
}

export const EntryVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type EntryVisibilityKeys = (typeof EntryVisibility)[keyof typeof EntryVisibility]

export const EntryCardKindLabel = {
  model: 'model card',
  'data-card': 'data card',
} as const
export type EntryCardKindLabelKeys = (typeof EntryCardKindLabel)[keyof typeof EntryCardKindLabel]

export const EntryCardKind = {
  model: 'model-card',
  'data-card': 'data-card',
} as const
export type EntryCardKindKeys = (typeof EntryCardKind)[keyof typeof EntryCardKind]

export interface EntryCardInterface {
  schemaId: string
  version: number
  createdBy: string
  metadata: unknown
}

export interface CollaboratorEntry {
  entity: string
  roles: Array<'owner' | 'contributor' | 'consumer' | string>
}

export const EntryKindLabel = {
  model: 'model',
  'data-card': 'data card',
  'mirrored-model': 'mirrored model',
} as const
export type EntryKindLabelKeys = (typeof EntryKindLabel)[keyof typeof EntryKindLabel]

export const EntryKind = {
  MODEL: 'model',
  DATA_CARD: 'data-card',
} as const
export type EntryKindKeys = (typeof EntryKind)[keyof typeof EntryKind]

export const isEntryKind = (value: unknown): value is EntryKindKeys => {
  return !!value && (value === EntryKind.MODEL || value === EntryKind.DATA_CARD)
}

export const CreateEntryKind = {
  ...EntryKind,
  MIRRORED_MODEL: 'mirrored-model',
} as const
export type CreateEntryKindKeys = (typeof CreateEntryKind)[keyof typeof CreateEntryKind]

export interface EntryInterface {
  id: string
  name: string
  kind: EntryKindKeys
  description: string
  state?: string
  organisation?: string
  settings: {
    ungovernedAccess?: boolean
    allowTemplating?: boolean
    mirror?: {
      sourceModelId?: string
      destinationModelId?: string
    }
  }
  card: EntryCardInterface
  visibility: EntryVisibilityKeys
  collaborators: CollaboratorEntry[]
  createdBy: string
  createdAt: Date
}

export interface EntryForm {
  name: string
  kind: EntryKindKeys
  description: string
  state?: string
  organisation?: string
  visibility: EntryVisibilityKeys
  collaborators?: CollaboratorEntry[]
  settings?: {
    ungovernedAccess: boolean
    allowTemplating: boolean
    mirror?: {
      sourceModelId?: string
      destinationModelId?: string
    }
  }
}

export type UpdateEntryForm = Omit<EntryForm, 'kind' | 'collaborators'>

export interface AccessRequestMetadata {
  overview: {
    name: string
    entities: Array<string>
    endDate?: string
    [x: string]: unknown
  }
  [x: string]: unknown
}

export interface AccessRequestInterface {
  _id: string
  id: string
  modelId: string
  schemaId: string
  deleted: boolean
  metadata: AccessRequestMetadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ModelImage {
  repository: string
  name: string
  tags: Array<string>
}

export interface FlattenedModelImage {
  repository: string
  name: string
  tag: string
}

export interface FileWithMetadata {
  fileName: string
  metadata?: string
}

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
  Undo: 'undo',
} as const
export type DecisionKeys = (typeof Decision)[keyof typeof Decision]

type PartialReviewRequestInterface =
  | {
      accessRequestId: string
      semver?: never
    }
  | {
      accessRequestId?: never
      semver: string
    }

export const ReviewKind = {
  ACCESS: 'access',
  RELEASE: 'release',
} as const
export type ReviewKindKeys = (typeof ReviewKind)[keyof typeof ReviewKind]

export type ReviewRequestInterface = {
  _id: string
  model: EntryInterface
  role: string
  kind: 'release' | 'access'
  createdAt: string
  updatedAt: string
} & PartialReviewRequestInterface

export interface FileUploadProgress {
  fileName: string
  uploadProgress: number
}

export interface InferenceInterface {
  modelId: string
  image: string
  tag: string
  settings: {
    processorType: string
    memory?: number
    port: number
  }
  description: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const ReviewListStatus = {
  OPEN: 'open',
  ARCHIVED: 'archived',
} as const
export type ReviewListStatusKeys = (typeof ReviewListStatus)[keyof typeof ReviewListStatus]

export function isReviewKind(value: unknown): value is ReviewKindKeys {
  return value === ReviewKind.RELEASE || value === ReviewKind.ACCESS
}

export interface FailedFileUpload {
  fileName: string
  error: string
}

export interface SuccessfulFileUpload {
  fileName: string
  fileId: string
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

export type EntryUserPermissions = {
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

export type AccessRequestUserPermissions = {
  editAccessRequest: PermissionDetail
  deleteAccessRequest: PermissionDetail
}

export type UserPermissions = EntryUserPermissions & AccessRequestUserPermissions

export type RestrictedActionKeys = keyof UserPermissions
