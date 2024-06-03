export interface User {
  dn: string
}

export const RoleKind = {
  MODEL: 'model',
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
}
