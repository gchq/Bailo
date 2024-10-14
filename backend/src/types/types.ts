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
