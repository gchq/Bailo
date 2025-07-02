import ModelModel from '../models/Model.js'
import SchemaModel from '../models/Schema.js'
import { RoleKind } from '../types/types.js'
import { BadReq } from '../utils/error.js'
import { findReviewRoles } from './review.js'

export async function getAllEntryRoles(modelId?: string) {
  const reviewRoles = await findReviewRoles()
  let reviewRolesForSchema: string[] = []
  if (modelId) {
    const model = await ModelModel.findOne({ id: modelId })
    if (!model) {
      throw BadReq('Could not find requested model', { modelId })
    }
    if (!model.card) {
      throw BadReq('Model does not have a schema assigned to it', { modelId })
    }
    const modelSchema = await SchemaModel.findOne({ id: model.card.schemaId })
    if (!modelSchema) {
      throw BadReq('Could not find requested schema', { id: model.card.schemaId })
    }
    reviewRolesForSchema = modelSchema.reviewRoles
  }
  return [
    ...reviewRoles
      .filter((role) => reviewRolesForSchema.includes(role.short))
      .map((role) => {
        return {
          _id: role['_id'],
          name: role.name,
          kind: RoleKind.SCHEMA,
          description: role.description,
          short: role.short,
        }
      }),
    {
      short: 'consumer',
      name: 'Consumer',
      kind: RoleKind.ENTRY,
      description:
        'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
    },
    {
      short: 'contributor',
      name: 'Contributor',
      kind: RoleKind.ENTRY,
      description: 'This role allows users edit the model card and draft releases.',
    },
    {
      short: 'owner',
      name: 'Owner',
      kind: RoleKind.ENTRY,
      description: 'This role includes all permissions, such as managing model access and model deletion.',
    },
  ]
}
