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

export interface EntryCardRevisionInterface {
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
  MODEL: 'model',
  ACCESS_REQUEST: 'accessRequest',
  DATA_CARD: 'dataCard',
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
  isAdmin: boolean
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

export const TokenActionKind = {
  READ: 'read',
  WRITE: 'write',
}

export type TokenActionKindKeys = (typeof TokenActionKind)[keyof typeof TokenActionKind]

export const TokenAction = {
  MODEL_READ: 'model:read',
  MODEL_WRITE: 'model:write',

  RELEASE_READ: 'release:read',
  RELEASE_WRITE: 'release:write',

  ACCESS_REQUEST_READ: 'access_request:read',
  ACCESS_REQUEST_WRITE: 'access_request:write',

  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',

  IMAGE_READ: 'image:read',
  IMAGE_WRITE: 'image:write',

  SCHEMA_READ: 'schema:read',
  SCHEMA_WRITE: 'schema:write',

  TOKEN_READ: 'token:read',
  TOKEN_WRITE: 'token:write',
} as const

export type TokenActionKeys = (typeof TokenAction)[keyof typeof TokenAction]

export const TokenCategory = {
  PERSONAL_ACCESS: 'personal access',
  KUBERNETES: 'kubernetes',
  ROCKET: 'rocket',
  PODMAN: 'podman',
  DOCKER_LOGIN: 'docker login',
  DOCKER_CONFIGURATION: 'docker configuration',
} as const

export type TokenCategoryKeys = (typeof TokenCategory)[keyof typeof TokenCategory]

export function isTokenCategory(value: string | string[] | undefined): value is TokenCategoryKeys {
  return (
    value === TokenCategory.PERSONAL_ACCESS ||
    value === TokenCategory.KUBERNETES ||
    value === TokenCategory.ROCKET ||
    value === TokenCategory.PODMAN ||
    value === TokenCategory.DOCKER_LOGIN ||
    value === TokenCategory.DOCKER_CONFIGURATION
  )
}

export interface TokenInterface {
  user: string
  description: string
  scope: TokenScopeKeys
  modelIds: Array<string>
  actions: Array<TokenActionKeys>
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

export interface TeamInterface {
  id: string

  name: string
  description: string

  deleted: boolean

  createdAt: Date
  updatedAt: Date
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

export interface EntryInterface {
  id: string
  name: string
  kind: EntryKindKeys
  teamId: string
  description: string
  settings: {
    ungovernedAccess: boolean
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
  teamId: string
  description: string
  visibility: EntryVisibilityKeys
}

export type UpdateEntryForm = Omit<EntryForm, 'kind'>

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
  id: string
  modelId: string
  schemaId: string
  deleted: boolean
  metadata: AccessRequestMetadata
  comments: Array<ReviewComment>
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

export interface ReviewResponse {
  user: string
  decision: DecisionKeys
  role: string
  comment?: string
  outdated?: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewResponseWithRole extends ReviewResponse {
  role: string
}

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
  model: EntryInterface
  role: string
  kind: 'release' | 'access'
  responses: ReviewResponse[]
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
