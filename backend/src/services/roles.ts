import ModelModel from '../models/Model.js'
import { Role, RoleKind } from '../types/types.js'
import { BadReq } from '../utils/error.js'
import log from './log.js'
import { findReviewRoles } from './review.js'

export async function getAllEntryRoles(modelId?: string) {
  let schemaRoles: Array<Role> = []
  if (modelId) {
    const model = await ModelModel.findOne({ id: modelId })
    if (!model) {
      throw BadReq('Could not find requested model', { modelId })
    }
    if (model.card?.schemaId) {
      const reviewRoles = await findReviewRoles(model.card.schemaId)
      schemaRoles = reviewRoles.map((role) => ({
        name: role.name,
        kind: RoleKind.SCHEMA,
        description: role.description,
        short: role.short,
      }))
    } else {
      log.info({ modelId }, 'Schema has not been set on the model. Returning system roles.')
    }
  }
  return [
    ...schemaRoles,
    {
      short: 'consumer',
      name: 'Consumer',
      kind: RoleKind.SYSTEM,
      description:
        'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
    },
    {
      short: 'contributor',
      name: 'Contributor',
      kind: RoleKind.SYSTEM,
      description: 'This role allows users edit the model card and draft releases.',
    },
    {
      short: 'owner',
      name: 'Owner',
      kind: RoleKind.SYSTEM,
      description: 'This role includes all permissions, such as managing model access and model deletion.',
    },
  ]
}
