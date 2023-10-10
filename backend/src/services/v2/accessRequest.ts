import { Validator } from 'jsonschema'

import { AccessRequestInterface } from '../../models/v2/AccessRequest.js'
import AccessRequest from '../../models/v2/AccessRequest.js'
import { UserDoc } from '../../models/v2/User.js'
import { isValidatorResultError } from '../../types/v2/ValidatorResultError.js'
import { BadReq } from '../../utils/v2/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { createAccessRequestReviews } from './review.js'
import { findSchemaById } from './schema.js'

export type CreateAccessRequestParams = Pick<AccessRequestInterface, 'entities' | 'metadata' | 'schemaId'>
export async function createAccessRequest(
  user: UserDoc,
  modelId: string,
  accessRequestInfo: CreateAccessRequestParams,
) {
  // Check the model exists and the user can view it before creating an AR
  const model = await getModelById(user, modelId)

  // Ensure that the AR meets the schema
  const schema = await findSchemaById(accessRequestInfo.schemaId)
  try {
    new Validator().validate(accessRequestInfo.metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Access Request Metadata could not be validated against the schema.', {
        schemaId: accessRequestInfo.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const accessRequest = new AccessRequest({
    createdBy: user.dn,
    modelId,
    ...accessRequestInfo,
  })
  await accessRequest.save()

  try {
    await createAccessRequestReviews(model, accessRequest)
  } catch (error) {
    // Transactions here would solve this issue.
    log.warn('Error when creating Release Review Requests. Approval cannot be given to this Access Request', error)
  }

  return accessRequest
}
