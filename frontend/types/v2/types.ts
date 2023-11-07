// TODO Once beta has been completed these types need to be merged back into types/types.
// Please note that some of these types have been duplicated, merge accordingly!

export const ModelVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type ModelVisibilityKeys = (typeof ModelVisibility)[keyof typeof ModelVisibility]

export interface ModelInterface {
  id: string
  name: string
  team: string
  description: string
  card: ModelCardInterface
  visibility: ModelVisibilityKeys
  collaborators: CollaboratorEntry[]
}

export interface ModelCardInterface {
  schemaId: string
  version: number
  createdBy: string

  metadata: unknown
}

export interface ModelCardRevisionInterface {
  modelId: string
  schemaId: string
  version: number
  metadata: unknown
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CollaboratorEntry {
  entity: string
  roles: Array<'Owner' | 'Contributor' | 'Consumer' | string>
}

export type ModelForm = {
  name: string
  team: string
  description: string
  visibility: ModelVisibilityKeys
}

export interface Role {
  id: string
  name: string
  short?: string
}

export const SchemaKind = {
  Model: 'model',
  AccessRequest: 'accessRequest',
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

export interface PostSimpleUpload {
  file: FileInterface
}
