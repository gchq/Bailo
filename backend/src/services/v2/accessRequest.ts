import { Validator } from 'jsonschema'

import { AccessRequestInterface } from '../../models/v2/AccessRequest.js'
import AccessRequest from '../../models/v2/AccessRequest.js'
import { UserDoc } from '../../models/v2/User.js'
import { isValidatorResultError } from '../../types/v2/ValidatorResultError.js'
import { BadReq, NotFound } from '../../utils/v2/error.js'
import { getModelById } from './model.js'
import { findSchemaById } from './schema.js'

export type CreateAccessRequestParams = Pick<AccessRequestInterface, 'entity' | 'metadata' | 'schemaId'>
export async function createAccessRequest(user: UserDoc, modelId: string, accessRequest: CreateAccessRequestParams) {
  // Check the model exists and the user can view it before making an AR
  await getModelById(user, modelId)

  // Ensure that the AR meets the schema
  const schema = await findSchemaById(accessRequest.schemaId)
  if (!schema) {
    throw NotFound('Schema could not be found', { schemaId: accessRequest.schemaId })
  }
  try {
    new Validator().validate(accessRequest.metadata, schema.jsonSchema)
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Access Request Metadata could not be validated against the schema.', {
        schemaId: accessRequest.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const release = new AccessRequest({
    modelId,
    ...accessRequest,
  })

  return await release.save()
}
