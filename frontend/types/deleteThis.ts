import { CollaboratorRolesKeys, CollaboratorRoleType, RoleKindKeys } from 'types/types'

export interface ReviewRoleInterface {
  _id: string
  name: string
  shortName: string
  kind: RoleKindKeys
  description?: string | undefined
  defaultEntities?: string[] | undefined
  lockEntities?: boolean | undefined
  collaboratorRole?: CollaboratorRolesKeys | undefined
  createdAt: string
  updatedAt: string
}

export type ReviewRolesFormData = {
  name: string
  shortName: string
  kind?: RoleKindKeys | undefined
  description?: string | undefined
  defaultEntities?: string[] | undefined
  lockEntities: boolean
  collaboratorRole?: CollaboratorRoleType | undefined
}

export type UpdateReviewRolesParams = {
  shortName: string
  name: string
  description?: string | undefined
  defaultEntities?: string[] | undefined
  lockEntities?: boolean | undefined
  collaboratorRole?: CollaboratorRolesKeys | undefined
}

export type UpdateReviewRolesParamsReal = Pick<
  ReviewRoleInterface,
  'shortName' | 'name' | 'description' | 'defaultEntities' | 'lockEntities' | 'collaboratorRole'
>
