export type PartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: PartialDeep<T[P]>
    }
  : T

export const RoleKind = {
  ENTRY: 'entry',
  SCHEMA: 'schema',
} as const

export enum EntityKind {
  USER = 'user',
  GROUP = 'group',
}

export type RoleKindKeys = (typeof RoleKind)[keyof typeof RoleKind]

export interface Role {
  id: string
  name: string
  kind: RoleKindKeys
  short?: string
  description?: string
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
