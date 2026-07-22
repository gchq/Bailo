import { UiSchema } from '@rjsf/utils'
import { Dispatch, JSX, SetStateAction } from 'react'

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
      additionalInfoHeading: string
      originalAnswerHeading: string
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

  roleDisplayNames: {
    owner: string
    contributor: string
    consumer: string
  }

  untrustedModel: {
    enabled: boolean
    untrustedModelDescription: string
    fileUploadGuidance: string
  }

  llmImport: {
    enabled: boolean
  }
}

export interface FileInterface {
  _id: string
  modelId: string

  name: string
  size: number
  mime: string

  path: string

  complete: boolean

  // Older files may not have scans run against them
  scanResults?: AvScanResult[]

  tags: string[]

  createdAt: Date
  updatedAt: Date
}

export type FileWithScanResultsInterface = FileInterface & { scanResults: ScanResultInterface[]; id: string }

export interface ScanResultInterface {
  _id: string
  state: ArtefactScanStateKeys
  scannerVersion?: string
  summary?: ScanSummary
  additionalInfo?: TrivyScanResultResponse | ModelScanResponse
  platform?: string
  toolName: string
  lastRunAt: string

  createdAt: Date
  updatedAt: Date
}

export const SeverityLevel = {
  UNKNOWN: 'unknown',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const
export type SeverityLevelKeys = (typeof SeverityLevel)[keyof typeof SeverityLevel]

export const ArtefactScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Skipped: 'skipped',
  Error: 'error',
} as const
export type ArtefactScanStateKeys = (typeof ArtefactScanState)[keyof typeof ArtefactScanState]

export type AvScanResult = ScanResultInterface &
  (
    | {
        artefactKind: typeof ArtefactKind.FILE
        fileId: string
      }
    | {
        artefactKind: typeof ArtefactKind.IMAGE
        repositoryName: string
        imageDigest: string
        // TODO: ultimately use a mapped version of backend/src/models/Release.ts:ImageRef, but ImageRef needs converting to use Digest rather than Tag first
      }
  )

export const ArtefactKind = {
  FILE: 'file',
  IMAGE: 'image',
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
  jsonSchema: unknown
  uiSchema: unknown
  reviewRoles: string[]
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
  mirrored: boolean
}

export const RoleKind = {
  ENTRY: 'entry',
  REVIEW: 'review',
} as const

export type RoleKindKeys = (typeof RoleKind)[keyof typeof RoleKind]

export const SystemRole = {
  Owner: 'owner',
  Contributor: 'contributor',
  Consumer: 'consumer',
  None: '',
} as const

export type SystemRoleKeys = (typeof SystemRole)[keyof typeof SystemRole]

export type CollaboratorRoleType = SystemRoleKeys | string

export interface EntryRole {
  name: string
  kind: RoleKindKeys
  shortName: string
  description?: string
  systemRole?: SystemRoleKeys
}

export type ReviewRolesFormData = EntryRole & {
  defaultEntities?: string[]
  lockEntities: boolean
}

export const SchemaKindLabel = {
  model: 'model',
  accessRequest: 'access request',
  dataCard: 'data card',
}
export type SchemaKindLabelKeys = (typeof SchemaKindLabel)[keyof typeof SchemaKindLabel]

export const SchemaKind = {
  MODEL: 'model',
  ACCESS_REQUEST: 'accessRequest',
  DATA_CARD: 'dataCard',
} as const

export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export const isSchemaKind = (value: unknown): value is SchemaKindKeys => {
  return Object.values(SchemaKind).includes(value as SchemaKindKeys)
}

export const isFileInterface = (file: File | FileInterface): file is FileInterface => {
  return (file as FileInterface).path !== undefined
}

export interface PostSimpleUpload {
  file: FileInterface
}

export interface User {
  dn: string
  isAdmin: boolean
}

export interface UserV3 {
  dn: string
  systemRoles: string[]
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
  mirroredState?: any
  compareFromState?: any
  compareFromMirroredState?: any
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
  'mirrored-model': 'model card',
  'untrusted-model': 'model card',
} as const
export type EntryCardKindLabelKeys = (typeof EntryCardKindLabel)[keyof typeof EntryCardKindLabel]

export const EntryCardKind = {
  model: 'model-card',
  'data-card': 'data-card',
  'mirrored-model': 'mirrored-model',
  'untrusted-model': 'untrusted-model',
} as const
export type EntryCardKindKeys = (typeof EntryCardKind)[keyof typeof EntryCardKind]

export interface EntryCardInterface {
  schemaId: string
  version: number
  createdBy: string
  createdAt: string
  mirrored: boolean
  metadata: unknown
}

export interface CollaboratorEntry {
  entity: string
  roles: Array<CollaboratorRoleType>
}

export const EntryKindLabel = {
  model: 'model',
  'data-card': 'data card',
  'mirrored-model': 'mirrored model',
  'untrusted-model': 'untrusted model',
} as const
export type EntryKindLabelKeys = (typeof EntryKindLabel)[keyof typeof EntryKindLabel]

export const EntryKind = {
  MODEL: 'model',
  DATA_CARD: 'data-card',
  MIRRORED_MODEL: 'mirrored-model',
  UNTRUSTED_MODEL: 'untrusted-model',
} as const
export type EntryKindKeys = (typeof EntryKind)[keyof typeof EntryKind]

export const MODEL_ENTRY_KINDS = [EntryKind.MODEL, EntryKind.MIRRORED_MODEL, EntryKind.UNTRUSTED_MODEL]

export const isEntryKind = (value: unknown): value is EntryKindKeys => {
  return !!value && (value === EntryKind.MODEL || value === EntryKind.DATA_CARD || value === EntryKind.MIRRORED_MODEL)
}

export interface EntryInterface {
  id: string
  name: string
  kind: EntryKindKeys
  description: string
  state?: string
  organisation?: string
  tags: string[]
  settings: {
    ungovernedAccess?: boolean
    allowTemplating?: boolean
    mirror?: {
      sourceModelId?: string
      destinationModelId?: string
    }
  }
  card: EntryCardInterface
  mirroredCard?: EntryCardInterface
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
  tags?: string[]
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
  scanSummaries: ScanResultInterface[]
}

export interface FlattenedModelImage {
  repository: string
  name: string
  tag: string
}

export interface FileWithMetadataAndTags {
  fileName: string
  metadata: FileUploadMetadata
}

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
  Undo: 'undo',
} as const
export type DecisionKeys = (typeof Decision)[keyof typeof Decision]

export type ReviewInterface =
  | ({
      kind: 'access'
      dueDate?: undefined
      semver?: undefined
      accessRequestId: string
    } & PartialReviewInterface)
  | ({
      kind: 'release'
      dueDate?: undefined
      semver: string
      accessRequestId?: undefined
    } & PartialReviewInterface)
  | ({
      kind: 'lifecycle'
      dueDate: Date
      semver?: undefined
      accessRequestId?: undefined
    } & PartialReviewInterface)

type PartialReviewInterface = {
  _id: string
  modelId: string
  role: string
  createdAt: string
  updatedAt: string
}

export const ReviewKind = {
  ACCESS: 'access',
  RELEASE: 'release',
  LIFECYCLE: 'lifecycle',
} as const
export type ReviewKindKeys = (typeof ReviewKind)[keyof typeof ReviewKind]

export type PartialReviewRequestInterface = {
  _id: string
  model: EntryInterface
  role: string
  createdAt: string
  updatedAt: string
}

export type ReviewRequestInterface =
  | ({
      kind: 'access'
      dueDate?: never
      semver?: never
      accessRequestId: string
    } & PartialReviewRequestInterface)
  | ({
      kind: 'release'
      dueDate?: never
      semver: string
      accessRequestId?: never
    } & PartialReviewRequestInterface)
  | ({
      kind: 'lifecycle'
      dueDate: Date
      semver?: never
      accessRequestId?: never
    } & PartialReviewRequestInterface)

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

export type FileUploadWithMetadata = {
  file: File
  metadata?: FileUploadMetadata
}

export type FileUploadMetadata = {
  tags: string[]
  text: string
}

export interface ReviewRoleInterface {
  _id: string
  name: string
  shortName: string
  kind: RoleKindKeys
  description?: string
  defaultEntities?: string[]
  lockEntities?: boolean
  systemRole: SystemRoleKeys
  createdAt: string
  updatedAt: string
}

export interface QuestionMigration {
  // id is only used in the UI for uniqueness
  id: string
  kind: string
  sourcePath: string
  targetPath?: string
  propertyType: string
}

export interface CombinedSchema {
  schema: SchemaInterface
  splitSchema: SplitSchemaNoRender
}

export interface SchemaMigrationInterface {
  name: string
  id: string
  description?: string
  questionMigrations: QuestionMigration[]
  draft: boolean
  sourceSchema: string
  targetSchema: string
  createdAt: string
  updatedAt: string
}

export const FederationState = {
  DISABLED: 'disabled',
  READ_ONLY: 'readOnly',
  ENABLED: 'enabled',
} as const

export type FederationStateKeys = (typeof FederationState)[keyof typeof FederationState]

export const PeerKind = {
  Bailo: 'bailo',
  HuggingFaceHub: 'huggingfacehub',
} as const
export type PeerKindKeys = (typeof PeerKind)[keyof typeof PeerKind]

export interface RemoteFederationConfig {
  state: FederationStateKeys
  baseUrl: string
  label: string
  kind: PeerKindKeys
  extra: {
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

// For completion stats on the model info page
export interface FormStats {
  totalQuestions: number
  totalAnswers: number
  percentageQuestionsComplete: number
  formCompleted: boolean
}

// For completion stats on the model info page
export interface ModelFormStats extends FormStats {
  totalPages: number
  pagesCompleted: number
  percentagePagesComplete: number
}

export type SeverityCounts = Record<SeverityLevelKeys, number>

export type ScanInterface = ScanResultInterface &
  (
    | {
        artefactKind: typeof ArtefactKind.FILE
        fileId: string
      }
    | {
        artefactKind: typeof ArtefactKind.IMAGE
        layerDigest: string
      }
  )

export type ScanInfoInterface = {
  toolName: string
  scannerVersion: string
  artefactKind: ArtefactKindKeys
}

export type ModelScanResponse = {
  summary: {
    total_issues: number
    total_issues_by_severity: {
      LOW: number
      MEDIUM: number
      HIGH: number
      CRITICAL: number
    }
    input_path: string
    absolute_path: string
    modelscan_version: string
    timestamp: string
    scanned: {
      total_scanned: number
      scanned_files: string[]
    }
    skipped: {
      total_skipped: number
      skipped_files: [
        {
          category: string
          description: string
          source: string
        },
      ]
    }
    issues: [
      {
        description: string
        operator: string
        module: string
        source: string
        scanner: string
        severity: string
      },
    ]
    errors: [
      {
        category: string
        description: string
        source: string
      },
    ]
  }
}

export type ScanSummary = (ModelScanSummary | ClamAVSummary | string)[]

export type ModelScanSummary = {
  severity: SeverityLevelKeys
  vulnerabilityDescription: string
}

export type ClamAVSummary = {
  virus: string
}

export type TrivyScanResultResponse = {
  SchemaVersion: string
  CreatedAt: string
  ArtifactName: string
  ArtifactType: string
  Metadata: {
    OS: {
      Family: string
      Name: string
    }
    ImageID: string
    DiffIDs: string[]
    RepoTags: string[]
    RepoDigests: string[]
  }
  Results: Results[]
}

export type Results = {
  Target: string
  Class: string
  Type: string
  Vulnerabilities: Vulnerabilities[]
  Misconfigurations: unknown[]
  Secrets: unknown[]
  Licenses: unknown[]
}

export type Vulnerabilities = {
  VulnerabilityID: string
  PkgID: string
  PkgName: string
  PkgIdentifier: {
    PURL: string
    UID: string
  }
  InstalledVersion: string
  FixedVersion: string
  Status: string
  Layer: {
    DiffID: string
  }
  PrimaryURL: string
  DataSource: {
    ID: string
    Name: string
    URL: string
  }
  Title: string
  Description: string
  Severity: string
  CweIDs: string[]
  VendorSeverity: {
    key: string
    level: number
  }

  References: string[]
  PublishedDate: string
  LastModifiedDate: string
}

export type ModelImagesWithOptionalScanResults = ModelImageTags & ImageScanResults

export type ModelImageTags = {
  repository: string
  name: string
  tags: Array<string>
}

export type ImageTagResult = {
  tag: string
  state: ArtefactScanStateKeys
  severityCounts: SeverityCounts
  platform?: string
  digest?: string
  scanResults?: ScanInterface[]
  imageSize: number
}

export type ImageScanResults = {
  scanSummaries: ImageTagResult[]
}

export type ModelImagesWithScanResults = ModelImageTags & ImageScanResults

export type ModelVolumeData = {
  startDate: string
  endDate: string
  count: number
  organisations: Record<string, number>
}

export type ModelVolume = {
  data: ModelVolumeData[]
  bucket: 'day' | 'week' | 'month' | 'quarter' | 'year'
  startDate: string
  endDate: string
}

export interface SchemaBreakDownMetrics {
  schemaId: string
  schemaName: string
  count: number
}

export interface ModelStateMetrics {
  state: string
  count: number
}

export interface OverviewBaseMetrics {
  users: number
  entries: number
  schemaBreakdown: SchemaBreakDownMetrics[]
  entryState: ModelStateMetrics[]
  withReleases: number
  withAccessRequest: number
}

export interface OrganisationOverviewMetrics extends OverviewBaseMetrics {
  organisation: string
}

export interface OverviewMetrics {
  global: OverviewBaseMetrics
  byOrganisation: OrganisationOverviewMetrics[]
  lastUpdated: string
}

export interface PolicyRoleSummaryMetrics {
  roleId: string
  roleName: string
  count: number
}

export interface PolicyRoleMetric {
  roleId: string
  roleName: string
}

export interface PolicyModelRoleMetrics {
  entryId: string
  missingRoles: PolicyRoleMetric[]
  modelOwners: string[]
}

export interface PolicyRoleBaseMetrics {
  summary: PolicyRoleSummaryMetrics[]
  entries: PolicyModelRoleMetrics[]
}

export interface OrganisationPolicyMetrics extends PolicyRoleBaseMetrics {
  organisation: string
}

export interface PolicyRoleMetrics {
  global: PolicyRoleBaseMetrics
  byOrganisation: OrganisationPolicyMetrics[]
  lastUpdated: string
}

export interface ModelBreakdown {
  entryId: string
  entryName: string
  entryKind: string
  modelOwners: string[]
}

export const Roles = {
  Admin: 'admin',
  Compliance: 'compliance',
} as const
export type RoleKeys = (typeof Roles)[keyof typeof Roles]

export interface NoReleasesSummaryMetrics {
  modelsWithNoReleases: number
}

export interface ModelsNoReleases {
  entryId: string
  organisation: string
  modelOwners: string[]
}

export interface GlobalNoReleasesMetrics {
  summary: NoReleasesSummaryMetrics
  entries: ModelsNoReleases[]
}

export interface NoReleaseMetricsByOrg {
  organisation: string
  summary: NoReleasesSummaryMetrics
  entries: ModelsNoReleases[]
}

export interface BaseNoReleaseMetrics {
  global: GlobalNoReleasesMetrics
  byOrganisation: NoReleaseMetricsByOrg[]
  lastUpdated: string
}
