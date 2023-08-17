export const SchemaKind = {
  Model: 'model',
  Deployment: 'deployment',
} as const
export type SchemaKindKeys = (typeof SchemaKind)[keyof typeof SchemaKind]

export const ApprovalKind = {
  Release: 'release',
  Access: 'access',
} as const
export type ApprovalKindKeys = (typeof ApprovalKind)[keyof typeof ApprovalKind]
