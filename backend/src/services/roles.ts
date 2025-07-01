import { RoleKind } from '../types/types.js'
import { findReviewRoles } from './review.js'

export async function getAllEntryRoles() {
  const reviewRoles = await findReviewRoles()
  return [
    ...reviewRoles.map((role) => {
      return { id: role.id, name: role.name, kind: RoleKind.SCHEMA, description: role.description }
    }),
    {
      id: 'consumer',
      name: 'Consumer',
      kind: RoleKind.ENTRY,
      description:
        'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
    },
    {
      id: 'contributor',
      name: 'Contributor',
      kind: RoleKind.ENTRY,
      description: 'This role allows users edit the model card and draft releases.',
    },
    {
      id: 'owner',
      name: 'Owner',
      kind: RoleKind.ENTRY,
      description: 'This role includes all permissions, such as managing model access and model deletion.',
    },
  ]
}
