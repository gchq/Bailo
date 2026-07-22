import ModelModel from '../models/Model.js'
import { ReviewRoleDoc } from '../models/ReviewRole.js'
import { UserInterface } from '../models/User.js'
import { BadReq } from '../utils/error.js'
import { getAccessRequestsByModel } from './accessRequest.js'
import log from './log.js'
import { findReviewRoles, getDefaultReviewRolesCached } from './review.js'

export async function getAllEntryRoles(user: UserInterface, modelId?: string): Promise<ReviewRoleDoc[]> {
  let schemaRoles: Array<ReviewRoleDoc> = []
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
      schemaRoles = await findReviewRoles([model.card.schemaId, ...accessRequestSchemaIds])
    } else {
      log.info({ modelId }, 'Schema has not been set on the model. Returning system roles.')
    }
  }
  return [...schemaRoles, ...(await getDefaultReviewRolesCached())]
}
