import { ProxyAgentOptions } from 'proxy-agent'

import { PeerKindKeys } from '../connectors/peer/index.js'
import { CollaboratorEntry, EntryKindKeys, EntryVisibilityKeys, SystemRolesKeys } from '../models/Model.js'
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

export interface ModelSearchResult {
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

export interface ModelSearchResultWithErrors {
  models: Array<ModelSearchResult>
  errors?: Record<string, BailoError>
}
