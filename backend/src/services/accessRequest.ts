import { Validator } from 'jsonschema'

import authentication from '../connectors/authentication/index.js'
import { AccessRequestAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { AccessRequestInterface } from '../models/AccessRequest.js'
import AccessRequest from '../models/AccessRequest.js'
import ResponseModel, { ResponseKind } from '../models/Response.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { isValidatorResultError } from '../types/ValidatorResultError.js'
import { toEntity } from '../utils/entity.js'
import { BadReq, Forbidden, InternalError, NotFound, Unauthorized } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import log from './log.js'
import { getModelById } from './model.js'
import { createAccessRequestReviews } from './review.js'
import { findSchemaById } from './schema.js'
import { sendWebhooks } from './webhook.js'

export type CreateAccessRequestParams = Pick<AccessRequestInterface, 'metadata' | 'schemaId'>
export async function createAccessRequest(
  user: UserInterface,
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
    log.warn(error, 'Error when creating Release Review Requests. Approval cannot be given to this Access Request')
  }

  sendWebhooks(
    accessRequest.modelId,
    WebhookEvent.CreateAccessRequest,
    `Access Request ${accessRequest.id} has been created for model ${accessRequest.modelId}`,
    { accessRequest },
  )

  return accessRequest
}

export async function removeAccessRequest(user: UserInterface, accessRequestId: string) {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  await accessRequest.delete()

  return { accessRequestId }
}

export async function getAccessRequestsByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const accessRequests = await AccessRequest.find({ modelId })

  const auths = await authorisation.accessRequests(user, model, accessRequests, AccessRequestAction.View)
  return accessRequests.filter((_, i) => auths[i].success)
}

export async function getAccessRequestById(user: UserInterface, accessRequestId: string) {
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
  user: UserInterface,
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

export async function newAccessRequestComment(user: UserInterface, accessRequestId: string, message: string) {
  const accessRequest = await AccessRequest.findOne({ id: accessRequestId })

  if (!accessRequest) {
    throw NotFound(`The requested access request was not found.`, { accessRequestId })
  }

  const commentResponse = new ResponseModel({
    user: toEntity('user', user.dn),
    kind: ResponseKind.Comment,
    comment: message,
    createdAt: new Date().toISOString(),
  })

  await commentResponse.save()

  const updatedAccessRequest = await AccessRequest.findOneAndUpdate(
    { _id: accessRequest._id },
    {
      $push: { commentIds: commentResponse._id },
    },
  )

  if (!updatedAccessRequest) {
    throw InternalError(`Updated of access request failed.`, { accessRequestId })
  }

  return updatedAccessRequest
}

export async function updateAccessRequestComment(
  user: UserInterface,
  accessRequestId: string,
  commentId: string,
  message: string,
) {
  const accessRequest = await AccessRequest.findOne({ id: accessRequestId })

  if (!accessRequest) {
    throw NotFound(`The requested access request was not found.`, { accessRequestId })
  }

  if (!accessRequest.commentIds) {
    throw NotFound(`The requested access request does not contain any comments to edit.`, { accessRequestId })
  }

  const accessRequestComments = await ResponseModel.find({ _id: { $in: accessRequest.commentIds } })
  const originalComment = accessRequestComments.find((comment) => comment._id.toString() === commentId)

  if (!originalComment) {
    throw NotFound(`The requested access request comment was not found.`, { accessRequestId, commentId })
  }

  if (user.dn !== originalComment.user) {
    throw Unauthorized('You do not have permission to update this comment', { accessRequestId, commentId })
  }

  const updatedAccessRequest = await AccessRequest.findOneAndUpdate(
    { _id: accessRequest._id, 'comments._id': commentId },
    { 'comments.$[i].message': message },
    {
      arrayFilters: [
        {
          'i._id': `${commentId}`,
          'i.user': `${user.dn}`,
        },
      ],
    },
  )

  if (!updatedAccessRequest) {
    throw InternalError(`Updated of access request failed.`, { accessRequestId })
  }

  return updatedAccessRequest
}

export async function getModelAccessRequestsForUser(user: UserInterface, modelId: string) {
  const accessRequests = await AccessRequest.find({
    modelId,
    'metadata.overview.entities': { $in: await authentication.getEntities(user) },
  })

  return accessRequests
}
