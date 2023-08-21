export const SchemaKind = {
  Model: 'model',
  Deployment: 'deployment',
} as const
export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export const Boolean = {
  true: 'true',
  false: 'false',
} as const