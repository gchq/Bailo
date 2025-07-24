import ModelModel from '../models/Model.js'
import { UserInterface } from '../models/User.js'
import { Role, RoleKind } from '../types/types.js'
import { BadReq } from '../utils/error.js'
import { getAccessRequestsByModel } from './accessRequest.js'
import log from './log.js'
import { findReviewRoles } from './review.js'

export async function getAllEntryRoles(user: UserInterface, modelId?: string) {
  let schemaRoles: Array<Role> = []
  if (modelId) {
    const model = await ModelModel.findOne({ id: modelId })
    if (!model) {
      throw BadReq('Could not find requested model', { modelId })
    }
    if (model.card?.schemaId) {
      let accessRequestSchemaIds: string[] = []
      const accessRequestsForModel = await getAccessRequestsByModel(user, model.id)
      if (accessRequestsForModel.length > 0) {
        accessRequestSchemaIds = [...new Set(accessRequestsForModel.map((accessRequest) => accessRequest.schemaId))]
      }
      const modelReviewRoles = await findReviewRoles([model.card.schemaId, ...accessRequestSchemaIds])
      schemaRoles = modelReviewRoles.map((role) => ({
        name: role.name,
        kind: RoleKind.REVIEW,
        description: role.description,
        shortName: role.shortName,
      }))
    } else {
      log.info({ modelId }, 'Schema has not been set on the model. Returning system roles.')
    }
  }
  return [
    ...schemaRoles,
    {
      shortName: 'consumer',
      name: 'Consumer',
      kind: RoleKind.SYSTEM,
      description:
        'This provides read only permissions for the model. If a model is private, these users will be able to view the model and create access requests.',
    },
    {
      shortName: 'contributor',
      name: 'Contributor',
      kind: RoleKind.SYSTEM,
      description: 'This role allows users edit the model card and draft releases.',
    },
    {
      shortName: 'owner',
      name: 'Owner',
      kind: RoleKind.SYSTEM,
      description: 'This role includes all permissions, such as managing model access and model deletion.',
    },
  ]
}
