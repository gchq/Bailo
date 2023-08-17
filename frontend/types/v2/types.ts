// TODO Once beta has been completed these types need to be merged back into types/types.
// Please note that some of these types have been duplicated, merge accordingly!

export type Entity = {
  entity: string
  roles: string[]
}

export const ModelVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type ModelVisibilityKeys = (typeof ModelVisibility)[keyof typeof ModelVisibility]

export interface ModelInterface {
  id: string
  name: string
  description: string
  visibility: ModelVisibilityKeys
  collaborators: Entity[]
}
