export const RoleKind = {
  ENTRY: 'entry',
  SCHEMA: 'schema',
} as const

export type RoleKindKeys = (typeof RoleKind)[keyof typeof RoleKind]

export interface Role {
  id: string
  name: string
  kind: RoleKindKeys
  short?: string
  description?: string
}

export type PermissionDetail = {
  hasPermission: boolean
  info?: string
}

export interface EntryUserPermissions {
  editEntryCard: PermissionDetail

  viewEntrySettings: PermissionDetail

  createRelease: PermissionDetail
  editRelease: PermissionDetail
  deleteRelease: PermissionDetail
  reviewRelease: PermissionDetail

  reviewAccessRequest: PermissionDetail

  pushModelImage: PermissionDetail

  createInferenceService: PermissionDetail
  editInferenceService: PermissionDetail
  deleteInferenceService: PermissionDetail

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
    enabled: boolean
    disclaimer: string
  }

  announcement: {
    enabled: boolean
    text: string
    startTimestamp: string
  }
}
