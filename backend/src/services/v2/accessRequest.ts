import { Validator } from 'jsonschema'

import authentication from '../../connectors/v2/authentication/index.js'
import { AccessRequestAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { AccessRequestInterface } from '../../models/v2/AccessRequest.js'
import AccessRequest from '../../models/v2/AccessRequest.js'
import { UserDoc } from '../../models/v2/User.js'
import { WebhookEvent } from '../../models/v2/Webhook.js'
import { isValidatorResultError } from '../../types/v2/ValidatorResultError.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { convertStringToId } from '../../utils/v2/id.js'
import log from './log.js'
import { getModelById } from './model.js'
import { createAccessRequestReviews } from './review.js'
import { findSchemaById } from './schema.js'
import { sendWebhooks } from './webhook.js'

export type CreateAccessRequestParams = Pick<AccessRequestInterface, 'metadata' | 'schemaId'>
export async function createAccessRequest(
  user: UserDoc,
  modelId: string,
  accessRequestInfo: CreateAccessRequestParams,
) {
  // Check the model exists and the user can view it before creating an access request
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

  const accessRequestId = convertStringToId(accessRequestInfo.metadata.overview.name)
  const accessRequest = new AccessRequest({
    id: accessRequestId,
    createdBy: user.dn,
    modelId,
    comments: [],
    ...accessRequestInfo,
  })

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  await accessRequest.save()

  try {
    await createAccessRequestReviews(model, accessRequest)
  } catch (error) {
    // Transactions here would solve this issue.
    log.warn('Error when creating Release Review Requests. Approval cannot be given to this Access Request', error)
  }

  sendWebhooks(
    accessRequest.modelId,
    WebhookEvent.CreateAccessRequest,
    `Access Request ${accessRequest.id} has been created for model ${accessRequest.modelId}`,
    { accessRequest },
  )

  return accessRequest
}

export async function removeAccessRequest(user: UserDoc, accessRequestId: string) {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  await accessRequest.delete()

  return { accessRequestId }
}

export async function getAccessRequestsByModel(user: UserDoc, modelId: string) {
  const model = await getModelById(user, modelId)
  const accessRequests = await AccessRequest.find({ modelId })

  const auths = await authorisation.accessRequests(user, model, accessRequests, AccessRequestAction.View)
  return accessRequests.filter((_, i) => auths[i].success)
}

export async function getAccessRequestById(user: UserDoc, accessRequestId: string) {
  const accessRequest = await AccessRequest.findOne({ id: accessRequestId })
  if (!accessRequest) {
    throw NotFound('The requested access request was not found.', { accessRequestId })
  }

  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  return accessRequest
}

export type UpdateAccessRequestParams = Pick<AccessRequestInterface, 'metadata'>
export async function updateAccessRequest(
  user: UserDoc,
  accessRequestId: string,
  diff: Partial<UpdateAccessRequestParams>,
) {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  if (diff.metadata) {
    accessRequest.metadata = diff.metadata
    accessRequest.markModified('metadata')
  }

  await accessRequest.save()

  return accessRequest
}

export async function newAccessRequestComment(user: UserDoc, accessRequestId: string, message: string) {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  accessRequest.comments = []
  accessRequest.comments.push({ message, user: user.dn, createdAt: new Date().toISOString() })

  await accessRequest.save()

  return accessRequest
}

export async function getModelAccessRequestsForUser(user: UserDoc, modelId: string) {
  const accessRequests = await AccessRequest.find({
    modelId,
    'metadata.overview.entities': { $in: await authentication.getEntities(user) },
  })

  return accessRequests
}
